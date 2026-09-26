import { z } from "zod";
import { ensurePublicUser } from "../../lib/notes";
import { requireSupabase } from "../../lib/supabase";

const createNoteSchema = z.object({
  organ: z.string().trim().min(1).max(200),
  note: z.string().trim().min(1).max(10000),
});

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return Response.json({ error: "Sign in before saving notes." }, { status: 401 });
  }

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

  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) {
    return Response.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
  }

  try {
    await ensurePublicUser(authData.user);
    const { data, error } = await client
      .from("notes")
      .insert({
        user_id: authData.user.id,
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
