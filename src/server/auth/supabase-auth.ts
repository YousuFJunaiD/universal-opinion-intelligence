import { isPostgresMode } from "@/lib/data-access/config";
import { query } from "@/server/db/client";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { AuthUser } from "@/types/auth";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
}

export async function getSupabaseAuthUser(): Promise<AuthUser | null> {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return null;
  }
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : undefined,
    authProvider: "supabase"
  };

  if (isPostgresMode()) {
    await ensureSupabaseUser(authUser);
  }

  return authUser;
}

async function ensureSupabaseUser(user: AuthUser) {
  await query<UserRow>(
    `INSERT INTO users (id, email, name, created_at, updated_at)
     VALUES ($1, $2, $3, now(), now())
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = now()`,
    [user.id, user.email, user.name ?? null]
  );
}
