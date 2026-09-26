import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { ensurePublicUser } from "../../lib/notes";
import { createAuthenticatedSupabaseClient } from "../../lib/supabase";

const createNoteSchema = z.object({
  organ: z.string().trim().min(1).max(200),
  note: z.string().trim().min(1).max(10000),
});

type AuthContext = {
  client: SupabaseClient;
  user: User;
};

async function authenticate(request: Request): Promise<AuthContext | Response> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return Response.json({ error: "Sign in before using notes." }, { status: 401 });
  }

  const client = createAuthenticatedSupabaseClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return Response.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
  }
  return { client, user: data.user };
}

export async function GET(request: Request) {
  const context = await authenticate(request);
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

  const context = await authenticate(request);
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
