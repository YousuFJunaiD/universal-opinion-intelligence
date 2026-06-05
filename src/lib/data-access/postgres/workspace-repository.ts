import { query } from "@/server/db/client";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "@/types/workspace";

interface WorkspaceRow {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
}

interface WorkspaceMemberRow {
  id: string;
  workspace_id: string;
  user_id: string;
  email: string;
  role: WorkspaceRole;
  created_at: Date;
}

export class PostgresWorkspaceRepository {
  async create(name: string, ownerId: string, ownerEmail: string) {
    const id = crypto.randomUUID();
    const workspaceResult = await query<WorkspaceRow>(
      `INSERT INTO workspaces (id, name, owner_id, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       RETURNING id, name, owner_id, created_at`,
      [id, name, ownerId]
    );
    await query<WorkspaceMemberRow>(
      `INSERT INTO workspace_members (id, workspace_id, user_id, email, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'owner', now(), now())
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner', email = EXCLUDED.email, updated_at = now()`,
      [crypto.randomUUID(), id, ownerId, ownerEmail]
    );
    return mapWorkspace(workspaceResult.rows[0]);
  }

  async listForUser(userId: string) {
    const result = await query<WorkspaceRow>(
      `SELECT DISTINCT workspaces.id, workspaces.name, workspaces.owner_id, workspaces.created_at
       FROM workspaces
       JOIN workspace_members ON workspace_members.workspace_id = workspaces.id
       WHERE workspace_members.user_id = $1
       ORDER BY workspaces.created_at DESC`,
      [userId]
    );
    return result.rows.map(mapWorkspace);
  }

  async listMembers(workspaceId: string, userId: string) {
    await this.ensureMember(workspaceId, userId);
    const result = await query<WorkspaceMemberRow>(
      `SELECT id, workspace_id, user_id, email, role, created_at
       FROM workspace_members WHERE workspace_id = $1
       ORDER BY created_at DESC`,
      [workspaceId]
    );
    return result.rows.map(mapMember);
  }

  async addMember(workspaceId: string, actorUserId: string, input: { email: string; role: WorkspaceRole; userId: string }) {
    await this.ensureCanManage(workspaceId, actorUserId);
    await query(
      `INSERT INTO users (id, email, created_at, updated_at)
       VALUES ($1, $2, now(), now())
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now()`,
      [input.userId, input.email]
    );
    const result = await query<WorkspaceMemberRow>(
      `INSERT INTO workspace_members (id, workspace_id, user_id, email, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, now(), now())
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, updated_at = now()
       RETURNING id, workspace_id, user_id, email, role, created_at`,
      [crypto.randomUUID(), workspaceId, input.userId, input.email, input.role]
    );
    return mapMember(result.rows[0]);
  }

  async updateMemberRole(workspaceId: string, memberId: string, actorUserId: string, role: WorkspaceRole) {
    await this.ensureCanManage(workspaceId, actorUserId);
    const result = await query<WorkspaceMemberRow>(
      `UPDATE workspace_members SET role = $3, updated_at = now()
       WHERE id = $1 AND workspace_id = $2 AND role <> 'owner'
       RETURNING id, workspace_id, user_id, email, role, created_at`,
      [memberId, workspaceId, role]
    );
    return result.rows[0] ? mapMember(result.rows[0]) : undefined;
  }

  async deleteMember(workspaceId: string, memberId: string, actorUserId: string) {
    await this.ensureCanManage(workspaceId, actorUserId);
    const result = await query<{ id: string }>(
      `DELETE FROM workspace_members
       WHERE id = $1 AND workspace_id = $2 AND role <> 'owner'
       RETURNING id`,
      [memberId, workspaceId]
    );
    return Boolean(result.rows[0]);
  }

  async getRole(workspaceId: string, userId: string) {
    const result = await query<{ role: WorkspaceRole }>(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, userId]
    );
    return result.rows[0]?.role;
  }

  async ensureMember(workspaceId: string, userId: string) {
    const role = await this.getRole(workspaceId, userId);
    if (!role) {
      throw new Error("Workspace was not found for the current user.");
    }
    return role;
  }

  async ensureCanManage(workspaceId: string, userId: string) {
    const role = await this.ensureMember(workspaceId, userId);
    if (role !== "owner" && role !== "admin") {
      throw new Error("Only workspace owners and admins can manage members.");
    }
    return role;
  }
}

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    createdAt: row.created_at.toISOString()
  };
}

function mapMember(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at.toISOString()
  };
}
