import type { AnalysisRunRequest } from "@/types/api";
import { localModeGetResponse, localModeResponse } from "@/app/api/local-mode-response";
import { isPostgresMode } from "@/lib/data-access/config";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import { analysisRunRequestSchema, formatZodError, parseJsonBody } from "@/lib/api/validation";
import { PostgresAnalysisRepository } from "@/lib/data-access/postgres/analysis-repository";
import { runDeepAnalysis } from "@/lib/services/multi-dimensional-analysis-service";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/analysis/run-deep";

export async function GET(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => localModeGetResponse("Run deep analysis", requestId));
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    const parsed = analysisRunRequestSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return validationErrorResponse(requestId, formatZodError(parsed.error));
    }
    const body: AnalysisRunRequest = parsed.data;

    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) {
        return user;
      }
      if (!body.preparedDatasetId || !body.analysisResultId) {
        return errorResponse({
          code: "missing_analysis_identifiers",
          message: "preparedDatasetId and analysisResultId are required in API mode.",
          requestId,
          status: 400
        });
      }

      const analysisRepository = new PostgresAnalysisRepository();
      const preparedDataset = await analysisRepository.findPreparedDatasetById(body.preparedDatasetId, user.id);
      const sentimentResult = await analysisRepository.findSentimentResultById(body.analysisResultId, user.id);
      if (!preparedDataset || !sentimentResult) {
        return errorResponse({
          code: "not_found",
          message: "Prepared dataset or sentiment result was not found.",
          requestId,
          status: 404
        });
      }
      const result = await analysisRepository.saveDeepAnalysisResult(
        await runDeepAnalysis(preparedDataset, sentimentResult),
        user.id
      );

      return successResponse(
        {
          mode: "api",
          persisted: true,
          message: "Deep analysis persisted in PostgreSQL API mode.",
          received: {
            multiDimensionalAnalysisResultId: result.id,
            projectId: result.projectId,
            analysisResultId: result.analysisResultId
          }
        },
        requestId,
        201
      );
    }

    return localModeResponse(
      "Run deep analysis contract accepted. Current UI runs deep analysis in browser localStorage.",
      body,
      requestId
    );
  });
}
