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

async function ensurePublicUser(user: User) {
  const { error } = await requireSupabase().from("users").upsert(
    {
      id: user.id,
      password: "managed-by-supabase-auth",
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function listUserNotes(): Promise<NoteRow[]> {
  const client = requireSupabase();
  const user = await currentUser();
  await ensurePublicUser(user);
  const { data, error } = await client
    .from("notes")
    .select("id,user_id,organ,note,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as NoteRow[];
}

export async function createUserNote(organ: string, note: string): Promise<NoteRow> {
  const client = requireSupabase();
  const user = await currentUser();
  await ensurePublicUser(user);
  const { data, error } = await client
    .from("notes")
    .insert({ user_id: user.id, organ, note })
    .select("id,user_id,organ,note,created_at,updated_at")
    .single();
  if (error) throw error;
  return data as NoteRow;
}

export async function updateUserNote(id: string, note: string): Promise<void> {
  const user = await currentUser();
  const { error } = await requireSupabase()
    .from("notes")
    .update({ note })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
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
