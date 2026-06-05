import type { AuthMode } from "@/types/auth";

export function getAuthMode(): AuthMode {
  return process.env.AUTH_MODE === "supabase" ? "supabase" : "dev";
}

export function isSupabaseAuthMode() {
  return getAuthMode() === "supabase";
}
