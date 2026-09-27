import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAuthenticatedSupabaseClient } from "./supabase";

export type AuthContext = {
  client: SupabaseClient;
  user: User;
};

export async function authenticateRequest(
  request: Request,
  resourceName: string,
): Promise<AuthContext | Response> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return Response.json({ error: `Sign in before using ${resourceName}.` }, { status: 401 });
  }

  try {
    const client = createAuthenticatedSupabaseClient(token);
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      return Response.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
    }
    return { client, user: data.user };
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to authenticate the request." },
      { status: 503 },
    );
  }
}
