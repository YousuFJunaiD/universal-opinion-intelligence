import type { WorkspaceMemberCreateRequest } from "@/types/api";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import { formatZodError, parseJsonBody, workspaceMemberCreateRequestSchema } from "@/lib/api/validation";
import { isPostgresMode } from "@/lib/data-access/config";
import { PostgresWorkspaceRepository } from "@/lib/data-access/postgres/workspace-repository";
import { requireCurrentUser } from "@/server/auth/require-current-user";

const ROUTE = "/api/workspaces/:id/members";

export async function GET(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    if (isPostgresMode()) {
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) return user;
      const { workspaceId } = await params;
      try {
        const members = await new PostgresWorkspaceRepository().listMembers(workspaceId, user.id);
        return successResponse({ members }, requestId);
      } catch (error) {
        return errorResponse({
          code: "forbidden",
          message: error instanceof Error ? error.message : "Workspace members are not available for the current user.",
          requestId,
          status: 403
        });
      }
    }

    return successResponse({ members: [] }, requestId);
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    const parsed = workspaceMemberCreateRequestSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return validationErrorResponse(requestId, formatZodError(parsed.error));
    }
    const body: WorkspaceMemberCreateRequest = parsed.data;
    if (body.role === "owner") {
      return errorResponse({
        code: "invalid_role",
        message: "Workspace owner role cannot be assigned through member management.",
        requestId,
        status: 400
      });
    }

    if (isPostgresMode()) {
      if (!body.userId) {
        return errorResponse({
          code: "missing_user_id",
          message: "userId is required until Supabase admin user lookup is added.",
          requestId,
          status: 400
        });
      }
      const user = await requireCurrentUser(requestId);
      if (user instanceof Response) return user;
      const { workspaceId } = await params;
      const repository = new PostgresWorkspaceRepository();
      try {
        await repository.addMember(workspaceId, user.id, { email: body.email, role: body.role, userId: body.userId });
        const members = await repository.listMembers(workspaceId, user.id);
        return successResponse({ members }, requestId, 201);
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
