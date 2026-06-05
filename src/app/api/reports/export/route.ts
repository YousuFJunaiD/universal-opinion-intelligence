import type { ReportExportCreateRequest } from "@/types/api";
import { localModeResponse } from "@/app/api/local-mode-response";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, successResponse, validationErrorResponse } from "@/lib/api/response";
import { formatZodError, parseJsonBody, reportExportCreateRequestSchema } from "@/lib/api/validation";
import { isPostgresMode } from "@/lib/data-access/config";
import { PostgresAnalysisRepository } from "@/lib/data-access/postgres/analysis-repository";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/reports/export";

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    const parsed = reportExportCreateRequestSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return validationErrorResponse(requestId, formatZodError(parsed.error));
    }
    const body: ReportExportCreateRequest = parsed.data;

    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) {
        return user;
      }
      const reportExport = await new PostgresAnalysisRepository().saveReportExport(body, user.id);
      return successResponse(
        {
          mode: "api",
          persisted: true,
          message: "Report export history persisted in PostgreSQL API mode.",
          received: reportExport
        },
        requestId,
        201
      );
    }

    return localModeResponse(
      "Report export contract accepted. Current UI stores export history in browser localStorage.",
      body,
      requestId
    );
  });
}
