import { z } from "zod";
import { authenticateRequest } from "../../lib/api-auth";
import { ensurePublicUser } from "../../lib/notes";

const createNoteSchema = z.object({
  organ: z.string().trim().min(1).max(200),
  note: z.string().trim().min(1).max(10000),
});

export async function GET(request: Request) {
  const context = await authenticateRequest(request, "notes");
  if (context instanceof Response) return context;

  try {
    await ensurePublicUser(context.user, context.client);
    const { data, error } = await context.client
      .from("notes")
      .select("id,user_id,organ,note,created_at,updated_at")
      .eq("user_id", context.user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return Response.json(data ?? []);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load notes." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid note request." }, { status: 400 });
  }

  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "A note must include an organ and non-empty text." },
      { status: 400 },
    );
  }

  const context = await authenticateRequest(request, "notes");
  if (context instanceof Response) return context;

  try {
    await ensurePublicUser(context.user, context.client);
    const { data, error } = await context.client
      .from("notes")
      .insert({
        user_id: context.user.id,
        organ: parsed.data.organ,
        note: parsed.data.note,
      })
      .select("id,user_id,organ,note,created_at,updated_at")
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save note." },
      { status: 500 },
    );
  }
}
