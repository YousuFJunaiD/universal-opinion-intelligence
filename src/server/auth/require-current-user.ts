import { errorResponse } from "@/lib/api/response";
import { getAuthMode } from "@/server/auth/auth-mode";
import { getCurrentUser } from "@/server/auth/get-current-user";
import type { AuthUser } from "@/types/auth";

export async function requireCurrentUser(requestId: string): Promise<AuthUser | Response> {
  let user: AuthUser | null;

  try {
    user = await getCurrentUser();
  } catch (error) {
    return errorResponse({
      code: "configuration_error",
      message: error instanceof Error ? error.message : "API authentication configuration is incomplete.",
      requestId,
      status: 503
    });
  }

  if (!user) {
    return errorResponse({
      code: "unauthorized",
      message:
        getAuthMode() === "supabase"
          ? "Authentication is required. Sign in with Supabase Auth to continue."
          : "No current API user is configured. Set DEV_USER_ID and DEV_USER_EMAIL for development API mode.",
      requestId,
      status: 401
    });
  }

  return user;
}
