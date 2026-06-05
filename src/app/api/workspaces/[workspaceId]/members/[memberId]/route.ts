import type { WorkspaceMemberUpdateRequest } from "@/types/api";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import { formatZodError, parseJsonBody, workspaceMemberUpdateRequestSchema } from "@/lib/api/validation";
import { isPostgresMode } from "@/lib/data-access/config";
import { PostgresWorkspaceRepository } from "@/lib/data-access/postgres/workspace-repository";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/workspaces/:id/members/:memberId";

export async function PATCH(request: Request, { params }: { params: Promise<{ workspaceId: string; memberId: string }> }) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    const parsed = workspaceMemberUpdateRequestSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return validationErrorResponse(requestId, formatZodError(parsed.error));
    }
    const body: WorkspaceMemberUpdateRequest = parsed.data;
    if (body.role === "owner") {
      return errorResponse({
        code: "invalid_role",
        message: "Workspace owner role cannot be assigned through member management.",
        requestId,
        status: 400
      });
    }

    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) return user;
      const { memberId, workspaceId } = await params;
      const repository = new PostgresWorkspaceRepository();
      try {
        const updated = await repository.updateMemberRole(workspaceId, memberId, user.id, body.role);
        if (!updated) {
          return errorResponse({ code: "not_found", message: "Member was not found or cannot be changed.", requestId, status: 404 });
        }
        const members = await repository.listMembers(workspaceId, user.id);
        return successResponse({ members }, requestId);
      } catch (error) {
        return errorResponse({
          code: "forbidden",
          message: error instanceof Error ? error.message : "Workspace members cannot be changed by the current user.",
          requestId,
          status: 403
        });
      }
    }

    return successResponse({ members: [] }, requestId, 202);
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ workspaceId: string; memberId: string }> }) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) return user;
      const { memberId, workspaceId } = await params;
      const repository = new PostgresWorkspaceRepository();
      try {
        const deleted = await repository.deleteMember(workspaceId, memberId, user.id);
        if (!deleted) {
          return errorResponse({ code: "not_found", message: "Member was not found or cannot be removed.", requestId, status: 404 });
        }
        const members = await repository.listMembers(workspaceId, user.id);
        return successResponse({ members }, requestId);
      } catch (error) {
        return errorResponse({
          code: "forbidden",
          message: error instanceof Error ? error.message : "Workspace members cannot be changed by the current user.",
          requestId,
          status: 403
        });
      }
    }

    return successResponse({ members: [] }, requestId, 202);
  });
}
