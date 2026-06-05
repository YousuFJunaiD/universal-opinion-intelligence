import { localModeGetResponse, localModeResponse } from "@/app/api/local-mode-response";
import { isPostgresMode } from "@/lib/data-access/config";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, successResponse } from "@/lib/api/response";
import { PostgresAnalysisRepository } from "@/lib/data-access/postgres/analysis-repository";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/reports";

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
        return successResponse({ reportExports: [], reportSnapshot: null }, requestId);
      }

      const repository = new PostgresAnalysisRepository();
      const [reportSnapshot, reportExports] = await Promise.all([
        repository.findReportSnapshotByProjectId(projectId, user.id),
        repository.findReportExportsByProjectId(projectId, user.id)
      ]);

      return successResponse({ reportExports, reportSnapshot: reportSnapshot ?? null }, requestId);
    }

    return localModeGetResponse("Reports", requestId);
  });
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () =>
    localModeResponse("Use /api/reports/generate to create report snapshots.", undefined, requestId)
  );
}
