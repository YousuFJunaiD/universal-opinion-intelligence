import type { EvaluationRunRequest } from "@/types/api";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, successResponse, validationErrorResponse } from "@/lib/api/response";
import { evaluationRunRequestSchema, formatZodError, parseJsonBody } from "@/lib/api/validation";
import { runBenchmarkEvaluation } from "@/lib/services/model-evaluation-service";

const ROUTE = "/api/evaluation/run";

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    const parsed = evaluationRunRequestSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return validationErrorResponse(requestId, formatZodError(parsed.error));
    }

    const body: EvaluationRunRequest = parsed.data;
    const result = await runBenchmarkEvaluation(body.dataset);

    return successResponse({ result }, requestId, 201);
  });
}
