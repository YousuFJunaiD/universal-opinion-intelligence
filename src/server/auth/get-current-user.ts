import { isPostgresMode } from "@/lib/data-access/config";
import { getAuthMode } from "@/server/auth/auth-mode";
import { getSupabaseAuthUser } from "@/server/auth/supabase-auth";
import { query } from "@/server/db/client";
import type { AuthUser } from "@/types/auth";

const DEFAULT_DEV_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEFAULT_DEV_USER_EMAIL = "dev@uoip.local";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (getAuthMode() === "supabase") {
    return getSupabaseAuthUser();
  }

  const userId = process.env.DEV_USER_ID ?? (process.env.NODE_ENV === "development" ? DEFAULT_DEV_USER_ID : undefined);
  const email =
    process.env.DEV_USER_EMAIL ?? (process.env.NODE_ENV === "development" ? DEFAULT_DEV_USER_EMAIL : undefined);

  if (!userId || !email) {
    return null;
  }

  const user: AuthUser = {
    id: userId,
    email,
    authProvider: "dev"
  };

  if (isPostgresMode()) {
    await ensureDevUser(user);
  }

  return user;
}

async function ensureDevUser(user: AuthUser) {
  await query<UserRow>(
    `INSERT INTO users (id, email, name, created_at, updated_at)
     VALUES ($1, $2, $3, now(), now())
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now()`,
    [user.id, user.email, "Development User"]
  );
}
