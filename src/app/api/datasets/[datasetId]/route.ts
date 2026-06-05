import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, errorResponse, successResponse } from "@/lib/api/response";
import { isPostgresMode } from "@/lib/data-access/config";
import { PostgresDatasetRepository } from "@/lib/data-access/postgres/dataset-repository";
import { PostgresProjectRepository } from "@/lib/data-access/postgres/project-repository";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/datasets/:id";

export async function DELETE(request: Request, { params }: { params: Promise<{ datasetId: string }> }) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) {
        return user;
      }

      const { datasetId } = await params;
      const deletedDataset = await new PostgresDatasetRepository().deleteById(datasetId, user.id);
      if (!deletedDataset) {
        return errorResponse({
          code: "not_found",
          message: "Dataset was not found for the current user.",
          requestId,
          status: 404
        });
      }

      await new PostgresProjectRepository().updateStatus(deletedDataset.project_id, "Draft", user.id);

      return successResponse(
        {
          mode: "api",
          persisted: true,
          message: "Dataset deleted.",
          received: { datasetId, projectId: deletedDataset.project_id }
        },
        requestId
      );
    }

    return successResponse(
      {
        mode: "local",
        persisted: false,
        message: "Dataset delete contract accepted. Local mode deletes browser localStorage."
      },
      requestId,
      202
    );
  });
}
