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
      const analysisJob = await readAnalysisSection("analysis jobs", requestId, projectId, () =>
        repository.findJobByProjectId(projectId, user.id)
      );
      const preparedDataset = await readAnalysisSection("prepared dataset", requestId, projectId, () =>
        repository.findPreparedDatasetByProjectId(projectId, user.id)
      );
      const analysisResult = await readAnalysisSection("sentiment results", requestId, projectId, () =>
        repository.findSentimentResultByProjectId(projectId, user.id)
      );
      const deepAnalysisResult = await readAnalysisSection("deep analysis results", requestId, projectId, () =>
        repository.findDeepAnalysisResultByProjectId(projectId, user.id)
      );
      const recommendationResult = await readAnalysisSection("recommendations", requestId, projectId, () =>
        repository.findRecommendationResultByProjectId(projectId, user.id)
      );
      await readAnalysisSection("report snapshots", requestId, projectId, () =>
        repository.findReportSnapshotByProjectId(projectId, user.id)
      );

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

async function readAnalysisSection<TResult>(
  section: string,
  requestId: string,
  projectId: string,
  read: () => Promise<TResult>
) {
  try {
    return await read();
  } catch (error) {
    console.error(
      JSON.stringify({
        code: "analysis_read_section_failed",
        errorCode: getErrorCode(error),
        message: error instanceof Error ? error.message : "Unknown read failure.",
        projectId,
        requestId,
        section,
        timestamp: new Date().toISOString()
      })
    );
    throw error;
  }
}

function getErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    return String(error.code);
  }
  return undefined;
}
