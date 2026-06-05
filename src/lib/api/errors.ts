import type { ApiErrorResponse } from "@/types/api";

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

export function createApiErrorResponse(
  code: string,
  message: string,
  details: unknown,
  requestId: string
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      requestId,
      timestamp: new Date().toISOString()
    }
  };
}
