import type { ProjectCreateRequest, ProjectResponse } from "@/types/api";
import { localModeGetResponse } from "@/app/api/local-mode-response";
import { isPostgresMode } from "@/lib/data-access/config";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import { formatZodError, parseJsonBody, projectCreateRequestSchema } from "@/lib/api/validation";
import { PostgresProjectRepository } from "@/lib/data-access/postgres/project-repository";
import { PostgresWorkspaceRepository } from "@/lib/data-access/postgres/workspace-repository";
import { requireCurrentUser } from "@/server/auth/require-current-user";
import type { OpinionProject } from "@/types/project";

const ROUTE = "/api/projects";

export async function GET(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) {
        return user;
      }
      const projects = await new PostgresProjectRepository().list(user.id);
      return successResponse({ projects }, requestId);
    }

    return localModeGetResponse("Projects", requestId);
  });
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
  const parsed = projectCreateRequestSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) {
    return validationErrorResponse(requestId, formatZodError(parsed.error));
  }
  const body: ProjectCreateRequest = parsed.data;

  if (isPostgresMode()) {
    const user = await requireCurrentUser(requestId);
    if (user instanceof Response) {
      return user;
    }
    if (body.workspaceId) {
      const role = await new PostgresWorkspaceRepository().getRole(body.workspaceId, user.id);
      if (!role || role === "viewer") {
        return errorResponse(
          {
            code: "forbidden",
            message: "Workspace viewers cannot create projects.",
            requestId,
            status: 403
          }
        );
      }
    }
    const project: OpinionProject = {
      id: body.id ?? crypto.randomUUID(),
      name: body.name,
      analysisType: body.analysisType,
      dataSource: body.dataSource,
      goal: body.goal,
      status: "Draft",
      createdAt: new Date().toISOString(),
      workspaceId: body.workspaceId
    };
    const savedProject = await new PostgresProjectRepository().create(project, user.id);
    return successResponse({ ...savedProject, mode: "api", persisted: true, message: "Project persisted in PostgreSQL API mode." }, requestId, 201);
  }

  const response: ProjectResponse = {
    analysisType: body.analysisType,
    dataSource: body.dataSource,
    goal: body.goal,
    mode: "local",
    name: body.name,
    persisted: false,
    status: "Draft",
    message: "Project contract accepted. Persist project in browser localStorage until server persistence is enabled."
  };

  return successResponse(response, requestId, 202);
  });
}
