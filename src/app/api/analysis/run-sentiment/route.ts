import type { AnalysisRunRequest } from "@/types/api";
import { localModeGetResponse, localModeResponse } from "@/app/api/local-mode-response";
import { isPostgresMode } from "@/lib/data-access/config";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import { analysisRunRequestSchema, formatZodError, parseJsonBody } from "@/lib/api/validation";
import { PostgresAnalysisRepository } from "@/lib/data-access/postgres/analysis-repository";
import { PostgresProjectRepository } from "@/lib/data-access/postgres/project-repository";
import { runSentimentAnalysis } from "@/lib/services/sentiment-analysis-service";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/analysis/run-sentiment";

export async function GET(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => localModeGetResponse("Run sentiment analysis", requestId));
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
      if (!body.preparedDatasetId) {
        return errorResponse({
          code: "missing_prepared_dataset",
          message: "preparedDatasetId is required in API mode.",
          requestId,
          status: 400
        });
      }

      const analysisRepository = new PostgresAnalysisRepository();
      const preparedDataset = await analysisRepository.findPreparedDatasetById(body.preparedDatasetId, user.id);
      if (!preparedDataset) {
        return errorResponse({
          code: "not_found",
          message: "Prepared dataset was not found.",
          requestId,
          status: 404
        });
      }
      const job = {
        id: preparedDataset.analysisJobId,
        projectId: preparedDataset.projectId,
        datasetId: preparedDataset.datasetId,
        preparedDatasetId: preparedDataset.id,
        status: "ready" as const,
        createdAt: preparedDataset.createdAt,
        updatedAt: new Date().toISOString()
      };
      const result = await analysisRepository.saveSentimentResult(
        await runSentimentAnalysis(preparedDataset, job),
        user.id
      );
      await new PostgresProjectRepository().updateStatus(body.projectId, "Analysed", user.id);

      return successResponse(
        {
          mode: "api",
          persisted: true,
          message: "Sentiment analysis persisted in PostgreSQL API mode.",
          received: {
            analysisResultId: result.id,
            projectId: result.projectId,
            datasetId: result.datasetId,
            preparedDatasetId: result.preparedDatasetId
          }
        },
        requestId,
        201
      );
    }

    return localModeResponse(
      "Run sentiment analysis contract accepted. Current UI runs the baseline engine in browser localStorage.",
      body,
      requestId
    );
  });
}
