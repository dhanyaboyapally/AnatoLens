import { z } from "zod";
import { authenticateRequest } from "../../../../../lib/api-auth";

const createMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(30000).default(""),
  parts: z.array(z.unknown()).max(100).default([]),
});

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function POST(request: Request, routeContext: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid chat message request." }, { status: 400 });
  }

  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "A chat message has invalid content." }, { status: 400 });
  }

  const context = await authenticateRequest(request, "chat history");
  if (context instanceof Response) return context;

  const { conversationId } = await routeContext.params;
  if (!conversationId) {
    return Response.json({ error: "A conversation id is required." }, { status: 400 });
  }

  try {
    const { data: conversation, error: conversationError } = await context.client
      .from("chat_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", context.user.id)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return Response.json({ error: "Chat conversation not found." }, { status: 404 });
    }

    const { data, error } = await context.client
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        role: parsed.data.role,
        content: parsed.data.content,
        parts: parsed.data.parts,
      })
      .select("id,conversation_id,role,content,parts,created_at")
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save chat message." },
      { status: 500 },
    );
  }
}
