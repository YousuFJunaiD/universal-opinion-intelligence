import type { AnalysisRunRequest } from "@/types/api";
import { localModeGetResponse, localModeResponse } from "@/app/api/local-mode-response";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import { analysisRunRequestSchema, formatZodError, parseJsonBody } from "@/lib/api/validation";
import { isPostgresMode } from "@/lib/data-access/config";
import { PostgresAnalysisRepository } from "@/lib/data-access/postgres/analysis-repository";
import { generateRecommendationResult } from "@/lib/services/recommendation-result-service";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/recommendations/generate";

export async function GET(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => localModeGetResponse("Generate recommendations", requestId));
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
      if (!body.analysisResultId) {
        return errorResponse({
          code: "missing_analysis_result",
          message: "analysisResultId is required to generate recommendations in API mode.",
          requestId,
          status: 400
        });
      }

      const analysisRepository = new PostgresAnalysisRepository();
      const sentimentResult = await analysisRepository.findSentimentResultById(body.analysisResultId, user.id);
      const deepAnalysisResult = await analysisRepository.findDeepAnalysisResultByAnalysisResultId(body.analysisResultId, user.id);
      if (!sentimentResult || !deepAnalysisResult) {
        return errorResponse({
          code: "not_found",
          message: "Sentiment result or deep analysis result was not found.",
          requestId,
          status: 404
        });
      }

      const recommendationResult = await analysisRepository.saveRecommendationResult(
        generateRecommendationResult(sentimentResult, deepAnalysisResult),
        user.id
      );

      return successResponse(
        {
          mode: "api",
          persisted: true,
          message: "Recommendations persisted in PostgreSQL API mode.",
          received: {
            recommendationResultId: recommendationResult.id,
            projectId: recommendationResult.projectId,
            analysisResultId: recommendationResult.analysisResultId,
            multiDimensionalAnalysisResultId: recommendationResult.multiDimensionalAnalysisResultId
          }
        },
        requestId,
        201
      );
    }

    return localModeResponse(
      "Generate recommendations contract accepted. Current UI generates recommendations in browser localStorage.",
      body,
      requestId
    );
  });
}
