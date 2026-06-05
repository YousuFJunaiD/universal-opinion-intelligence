import type { WorkspaceCreateRequest } from "@/types/api";
import { localModeResponse } from "@/app/api/local-mode-response";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, successResponse, validationErrorResponse } from "@/lib/api/response";
import { formatZodError, parseJsonBody, workspaceCreateRequestSchema } from "@/lib/api/validation";
import { isPostgresMode } from "@/lib/data-access/config";
import { PostgresWorkspaceRepository } from "@/lib/data-access/postgres/workspace-repository";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/workspaces";

export async function GET(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) return user;
      const workspaces = await new PostgresWorkspaceRepository().listForUser(user.id);
      return successResponse({ workspaces }, requestId);
    }

    return successResponse({ workspaces: [] }, requestId);
  });
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    const parsed = workspaceCreateRequestSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return validationErrorResponse(requestId, formatZodError(parsed.error));
    }
    const body: WorkspaceCreateRequest = parsed.data;

    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) return user;
      const workspace = await new PostgresWorkspaceRepository().create(body.name, user.id, user.email);
      return successResponse({ message: "Workspace created.", persisted: true, workspace }, requestId, 201);
    }

    return localModeResponse("Workspace contract accepted. Local mode simulates workspaces in localStorage.", body, requestId);
  });
}
