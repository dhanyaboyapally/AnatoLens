import type { User } from "@supabase/supabase-js";
import { requireSupabase } from "./supabase";

export type NoteRow = {
  id: string;
  user_id: string;
  organ: string;
  note: string;
  created_at: string;
  updated_at: string;
};

async function currentUser(): Promise<User> {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error || !data.user) {
    throw new Error("Sign in before using notes.");
  }
  return data.user;
}

export async function ensurePublicUser(user: User, client = requireSupabase()) {
  const { error } = await client.from("users").upsert(
    {
      id: user.id,
      password: "managed-by-supabase-auth",
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

async function notesApiRequest(
  method: "GET" | "POST",
  body?: { organ: string; note: string },
): Promise<unknown> {
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) {
    throw new Error("Sign in before using notes.");
  }

  const response = await fetch("/api/notes", {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => null) as { error?: string } | unknown[] | NoteRow | null;
  if (!response.ok) {
    throw new Error(
      payload && !Array.isArray(payload) && "error" in payload && payload.error
        ? payload.error
        : "Unable to sync notes.",
    );
  }
  return payload;
}

export async function listUserNotes(): Promise<NoteRow[]> {
  const payload = await notesApiRequest("GET");
  return Array.isArray(payload) ? payload as NoteRow[] : [];
}

export async function createUserNote(organ: string, note: string): Promise<NoteRow> {
  return await notesApiRequest("POST", { organ, note }) as NoteRow;
}

export async function updateUserNote(id: string, note: string): Promise<NoteRow> {
  const user = await currentUser();
  const { data, error } = await requireSupabase()
    .from("notes")
    .update({ note })
    .select("id,user_id,organ,note,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error) throw error;
  return data as NoteRow;
}

export async function deleteUserNote(id: string): Promise<void> {
  const user = await currentUser();
  const { error } = await requireSupabase()
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}
