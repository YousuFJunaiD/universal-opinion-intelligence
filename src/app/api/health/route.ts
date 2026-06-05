import { DATA_MODE } from "@/lib/data-mode";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, successResponse } from "@/lib/api/response";
import { getAuthMode } from "@/server/auth/auth-mode";
import { getCurrentUser } from "@/server/auth/get-current-user";
import type { ApiHealthResponse } from "@/types/api";

const ROUTE = "/api/health";

export async function GET(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    let currentUser: ApiHealthResponse["currentUser"] = null;
    let error: string | undefined;

    try {
      currentUser = await getCurrentUser();
    } catch (caughtError) {
      error = caughtError instanceof Error ? caughtError.message : "API health check failed.";
    }

    const response: ApiHealthResponse = {
      authMode: getAuthMode(),
      currentUser,
      error,
      mode: DATA_MODE,
      status: error ? "unavailable" : "available",
      timestamp: new Date().toISOString()
    };

    return successResponse(response, requestId);
  });
}
