import type { LocalModeApiResponse } from "@/types/api";
import { successResponse } from "@/lib/api/response";

export function localModeResponse(message: string, received: unknown, requestId: string, status = 202) {
  const response: LocalModeApiResponse = {
    mode: "local",
    persisted: false,
    message,
    received
  };

  return successResponse(response, requestId, status);
}

export function localModeGetResponse(resource: string, requestId: string) {
  return successResponse(
    {
      mode: "local",
      persisted: false,
      message: `${resource} API contract is available, but server persistence is disabled in local mode.`
    },
    requestId
  );
}
