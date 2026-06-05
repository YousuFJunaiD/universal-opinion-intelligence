import type { AnalysisPrepareRequest } from "@/types/api";
import { localModeGetResponse, localModeResponse } from "@/app/api/local-mode-response";
import { isPostgresMode } from "@/lib/data-access/config";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import { analysisPrepareRequestSchema, formatZodError, parseJsonBody } from "@/lib/api/validation";
import { PostgresAnalysisRepository } from "@/lib/data-access/postgres/analysis-repository";
import { PostgresDatasetRepository } from "@/lib/data-access/postgres/dataset-repository";
import { PostgresProjectRepository } from "@/lib/data-access/postgres/project-repository";
import { prepareDatasetForAnalysis } from "@/lib/services/analysis-preparation-service";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/analysis/prepare";

export async function GET(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => localModeGetResponse("Analysis prepare", requestId));
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    const parsed = analysisPrepareRequestSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return validationErrorResponse(requestId, formatZodError(parsed.error));
    }
    const body: AnalysisPrepareRequest = parsed.data;

    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) {
        return user;
      }
      const dataset = await new PostgresDatasetRepository().findById(body.datasetId, user.id);
      if (!dataset) {
        return errorResponse({
          code: "not_found",
          message: "Dataset was not found.",
          requestId,
          status: 404
        });
      }

      const analysisRepository = new PostgresAnalysisRepository();
      const job = await analysisRepository.createJob(body.projectId, body.datasetId, user.id);
      const processingJob = (await analysisRepository.updateJob(job.id, { status: "processing" }, user.id)) ?? job;
      const preparedDataset = await analysisRepository.savePreparedDataset(
        prepareDatasetForAnalysis(dataset, processingJob),
        user.id
      );
      const readyJob = await analysisRepository.updateJob(job.id, {
        preparedDatasetId: preparedDataset.id,
        status: "ready"
      }, user.id);
      await new PostgresProjectRepository().updateStatus(body.projectId, "Ready for Analysis", user.id);

      return successResponse(
        {
          mode: "api",
          persisted: true,
          message: "Analysis prepared and persisted in PostgreSQL API mode.",
          received: {
            analysisJobId: readyJob?.id ?? job.id,
            preparedDatasetId: preparedDataset.id,
            projectId: body.projectId,
            datasetId: body.datasetId
          }
        },
        requestId,
        201
      );
    }

    return localModeResponse(
      "Prepare analysis contract accepted. Current UI prepares analysis in browser localStorage.",
      body,
      requestId
    );
  });
}
