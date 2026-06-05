import { errorResponse } from "@/lib/api/response";

export function logApiRequest({
  durationMs,
  method,
  requestId,
  route,
  status
}: {
  durationMs: number;
  method: string;
  requestId: string;
  route: string;
  status: number;
}) {
  console.info(
    JSON.stringify({
      durationMs,
      method,
      requestId,
      route,
      status,
      timestamp: new Date().toISOString()
    })
  );
}

export async function withApiLogging(
  request: Request,
  route: string,
  requestId: string,
  handler: () => Promise<Response>
) {
  const startedAt = Date.now();
  let response: Response;

  try {
    response = await handler();
  } catch (error) {
    response = errorResponse({
      code: "internal_server_error",
      details: error instanceof Error ? { name: error.name } : undefined,
      message: error instanceof Error ? error.message : "An unexpected API error occurred.",
      requestId,
      status: 500
    });
  }

  logApiRequest({
    durationMs: Date.now() - startedAt,
    method: request.method,
    requestId,
    route,
    status: response.status
  });
  return response;
}
