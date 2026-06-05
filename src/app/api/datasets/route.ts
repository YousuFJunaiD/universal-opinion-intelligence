import type { DatasetCreateRequest, DatasetResponse } from "@/types/api";
import { localModeGetResponse } from "@/app/api/local-mode-response";
import { isPostgresMode } from "@/lib/data-access/config";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, successResponse, validationErrorResponse } from "@/lib/api/response";
import { datasetCreateRequestSchema, formatZodError, parseJsonBody } from "@/lib/api/validation";
import { PostgresDatasetRepository } from "@/lib/data-access/postgres/dataset-repository";
import { PostgresProjectRepository } from "@/lib/data-access/postgres/project-repository";
import { requireCurrentUser } from "@/server/auth/require-current-user";
import type { Dataset } from "@/types/dataset";

const ROUTE = "/api/datasets";

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
        return successResponse({ datasets: [] }, requestId);
      }

      const datasets = await new PostgresDatasetRepository().findByProjectId(projectId, user.id);
      return successResponse({ datasets }, requestId);
    }

    return localModeGetResponse("Datasets", requestId);
  });
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
  const parsed = datasetCreateRequestSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) {
    return validationErrorResponse(requestId, formatZodError(parsed.error));
  }
  const body: DatasetCreateRequest = parsed.data;

  if (isPostgresMode()) {
    const user = await requireCurrentUser(requestId);
    if (user instanceof Response) {
      return user;
    }
    const createdAt = new Date().toISOString();
    const dataset: Dataset = {
      id: body.id ?? crypto.randomUUID(),
      projectId: body.projectId,
      sourceType: body.sourceType,
      createdAt,
      recordCount: body.records.length,
      records: body.records.map((text, index) => ({
        id: crypto.randomUUID(),
        text,
        sourceType: body.sourceType,
        createdAt,
        rowIndex: index
      })),
      fileName: body.fileName,
      selectedColumn: body.selectedColumn,
      columns: body.columns
    };
    const savedDataset = await new PostgresDatasetRepository().replaceForProject(dataset, user.id);
    await new PostgresProjectRepository().updateStatus(savedDataset.projectId, "Data Added", user.id);
    const response: DatasetResponse = {
      datasetId: savedDataset.id,
      mode: "api",
      persisted: true,
      projectId: savedDataset.projectId,
      recordCount: savedDataset.records.length,
      message: "Dataset persisted in PostgreSQL API mode."
    };
    return successResponse(response, requestId, 201);
  }

  const response: DatasetResponse = {
    datasetId: body.id,
    mode: "local",
    persisted: false,
    projectId: body.projectId,
    recordCount: body.records.length,
    message: "Dataset contract accepted. Persist dataset in browser localStorage until server persistence is enabled."
  };

  return successResponse(response, requestId, 202);
  });
}
