import type { ApiErrorResponse, ApiSuccessEnvelope } from "@/types/api";

export function createRequestId() {
  return crypto.randomUUID();
}

export function successResponse<TData>(data: TData, requestId: string, status = 200) {
  const payload: ApiSuccessEnvelope<TData> = {
    data,
    requestId,
    timestamp: new Date().toISOString()
  };

  return Response.json(payload, { status });
}

export function errorResponse({
  code,
  details,
  message,
  requestId,
  status = 500
}: {
  code: string;
  details?: unknown;
  message: string;
  requestId: string;
  status?: number;
}) {
  const payload: ApiErrorResponse = {
    error: {
      code,
      details,
      message,
      requestId,
      timestamp: new Date().toISOString()
    }
  };

  return Response.json(payload, { status });
}

export function validationErrorResponse(requestId: string, details: unknown) {
  return errorResponse({
    code: "validation_error",
    details,
    message: "Request body failed validation.",
    requestId,
    status: 400
  });
}
