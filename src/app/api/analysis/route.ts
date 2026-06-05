import { localModeGetResponse, localModeResponse } from "@/app/api/local-mode-response";
import { isPostgresMode } from "@/lib/data-access/config";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, successResponse } from "@/lib/api/response";
import { PostgresAnalysisRepository } from "@/lib/data-access/postgres/analysis-repository";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/analysis";

export async function GET(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) {
        return user;
      }
      const projectId = new URL(request.url).searchParams.get("projectId");
      if (!projectId) {
        return successResponse(
          {
            analysisJob: null,
            analysisResult: null,
            deepAnalysisResult: null,
            preparedDataset: null,
            recommendationResult: null
          },
          requestId
        );
      }

      const repository = new PostgresAnalysisRepository();
      const [analysisJob, preparedDataset, analysisResult, deepAnalysisResult, recommendationResult] =
        await Promise.all([
          repository.findJobByProjectId(projectId, user.id),
          repository.findPreparedDatasetByProjectId(projectId, user.id),
          repository.findSentimentResultByProjectId(projectId, user.id),
          repository.findDeepAnalysisResultByProjectId(projectId, user.id),
          repository.findRecommendationResultByProjectId(projectId, user.id)
        ]);

      return successResponse(
        {
          analysisJob: analysisJob ?? null,
          analysisResult: analysisResult ?? null,
          deepAnalysisResult: deepAnalysisResult ?? null,
          preparedDataset: preparedDataset ?? null,
          recommendationResult: recommendationResult ?? null
        },
        requestId
      );
    }

    return localModeGetResponse("Analysis", requestId);
  });
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () =>
    localModeResponse(
      "Use /api/analysis/prepare, /api/analysis/run-sentiment, or /api/analysis/run-deep.",
      undefined,
      requestId
    )
  );
}
