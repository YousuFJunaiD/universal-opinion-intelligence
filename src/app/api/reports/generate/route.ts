import type { ReportCreateRequest } from "@/types/api";
import { localModeGetResponse, localModeResponse } from "@/app/api/local-mode-response";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import { formatZodError, parseJsonBody, reportCreateRequestSchema } from "@/lib/api/validation";
import { isPostgresMode } from "@/lib/data-access/config";
import { PostgresAnalysisRepository } from "@/lib/data-access/postgres/analysis-repository";
import { PostgresDatasetRepository } from "@/lib/data-access/postgres/dataset-repository";
import { PostgresProjectRepository } from "@/lib/data-access/postgres/project-repository";
import { generateReportSnapshot } from "@/lib/services/report-generation-service";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/reports/generate";

export async function GET(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => localModeGetResponse("Generate report snapshot", requestId));
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    const parsed = reportCreateRequestSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return validationErrorResponse(requestId, formatZodError(parsed.error));
    }
    const body: ReportCreateRequest = parsed.data;

    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) {
        return user;
      }
      const projectRepository = new PostgresProjectRepository();
      const datasetRepository = new PostgresDatasetRepository();
      const analysisRepository = new PostgresAnalysisRepository();

      const [project, dataset, preparedDataset, analysisResult] = await Promise.all([
        projectRepository.findById(body.projectId, user.id),
        datasetRepository.findById(body.datasetId, user.id),
        analysisRepository.findPreparedDatasetById(body.preparedDatasetId, user.id),
        analysisRepository.findSentimentResultById(body.analysisResultId, user.id)
      ]);

      if (!project || !dataset || !preparedDataset || !analysisResult) {
        return errorResponse({
          code: "not_found",
          message: "Project, dataset, prepared dataset, or sentiment result was not found.",
          requestId,
          status: 404
        });
      }

      const deepAnalysisResult = body.multiDimensionalAnalysisResultId
        ? await analysisRepository.findDeepAnalysisResultById(body.multiDimensionalAnalysisResultId, user.id)
        : undefined;
      const recommendationResult = body.recommendationResultId
        ? await analysisRepository.findRecommendationResultById(body.recommendationResultId, user.id)
        : undefined;
      const snapshot = await analysisRepository.saveReportSnapshot(
        generateReportSnapshot({
          analysisResult,
          dataset,
          deepAnalysisResult,
          preparedDataset,
          project,
          recommendationResult
        }),
        user.id
      );
      await projectRepository.updateStatus(body.projectId, "Report Ready", user.id);

      return successResponse(
        {
          mode: "api",
          persisted: true,
          message: "Report snapshot persisted in PostgreSQL API mode.",
          received: {
            reportSnapshotId: snapshot.id,
            projectId: snapshot.projectId,
            datasetId: snapshot.datasetId,
            analysisResultId: snapshot.analysisResultId
          }
        },
        requestId,
        201
      );
    }

    return localModeResponse(
      "Generate report snapshot contract accepted. Current UI generates report snapshots in browser localStorage.",
      body,
      requestId
    );
  });
}
