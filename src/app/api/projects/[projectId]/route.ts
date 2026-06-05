import { localModeGetResponse } from "@/app/api/local-mode-response";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import { formatZodError, parseJsonBody, projectUpdateRequestSchema } from "@/lib/api/validation";
import { isPostgresMode } from "@/lib/data-access/config";
import { PostgresProjectRepository } from "@/lib/data-access/postgres/project-repository";
import { requireCurrentUser } from "@/server/auth/require-current-user";
import type { ProjectResponse, ProjectUpdateRequest } from "@/types/api";

const ROUTE = "/api/projects/:id";

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) {
        return user;
      }
      const { projectId } = await params;
      const project = await new PostgresProjectRepository().findById(projectId, user.id);
      return successResponse({ project: project ?? null }, requestId);
    }

    return localModeGetResponse("Project detail", requestId);
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    const parsed = projectUpdateRequestSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return validationErrorResponse(requestId, formatZodError(parsed.error));
    }
    const body: ProjectUpdateRequest = parsed.data;

    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) {
        return user;
      }

      const { projectId } = await params;
      const project = await new PostgresProjectRepository().update(projectId, body, user.id);
      if (!project) {
        return errorResponse({
          code: "not_found",
          message: "Project was not found for the current user.",
          requestId,
          status: 404
        });
      }

      return successResponse(
        { ...project, mode: "api", persisted: true, message: "Project updated." },
        requestId
      );
    }

    const response: ProjectResponse = {
      mode: "local",
      persisted: false,
      message: "Project update contract accepted. Local mode updates browser localStorage."
    };
    return successResponse(response, requestId, 202);
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) {
        return user;
      }

      const { projectId } = await params;
      const deleted = await new PostgresProjectRepository().delete(projectId, user.id);
      if (!deleted) {
        return errorResponse({
          code: "not_found",
          message: "Project was not found for the current user.",
          requestId,
          status: 404
        });
      }

      return successResponse(
        {
          mode: "api",
          persisted: true,
          message: "Project deleted.",
          received: { projectId }
        },
        requestId
      );
    }

    return successResponse(
      {
        mode: "local",
        persisted: false,
        message: "Project delete contract accepted. Local mode deletes browser localStorage."
      },
      requestId,
      202
    );
  });
}
