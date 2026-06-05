import { query } from "@/server/db/client";
import type { AnalysisType, OpinionProject, ProjectGoal, ProjectStatus } from "@/types/project";

interface ProjectRow {
  id: string;
  name: string;
  analysis_type: OpinionProject["analysisType"];
  data_source: OpinionProject["dataSource"];
  goal: OpinionProject["goal"];
  status: ProjectStatus;
  created_at: Date;
  workspace_id: string | null;
}

export class PostgresProjectRepository {
  async list(ownerId: string) {
    const result = await query<ProjectRow>(
      `SELECT id, name, analysis_type, data_source, goal, status, created_at, workspace_id
       FROM projects
       WHERE owner_id = $1
          OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = projects.workspace_id
              AND workspace_members.user_id = $1
          )
       ORDER BY created_at DESC`,
      [ownerId]
    );

    return result.rows.map(mapProject);
  }

  async create(project: OpinionProject, ownerId: string) {
    const result = await query<ProjectRow>(
      `INSERT INTO projects (id, owner_id, user_id, workspace_id, name, analysis_type, data_source, goal, status, created_at, updated_at)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, now())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         analysis_type = EXCLUDED.analysis_type,
         data_source = EXCLUDED.data_source,
         goal = EXCLUDED.goal,
         status = EXCLUDED.status,
         owner_id = EXCLUDED.owner_id,
         user_id = EXCLUDED.user_id,
         workspace_id = EXCLUDED.workspace_id,
         updated_at = now()
       RETURNING id, name, analysis_type, data_source, goal, status, created_at, workspace_id`,
      [
        project.id,
        ownerId,
        project.workspaceId ?? null,
        project.name,
        project.analysisType,
        project.dataSource,
        project.goal,
        project.status,
        project.createdAt
      ]
    );

    return mapProject(result.rows[0]);
  }

  async findById(projectId: string, ownerId: string) {
    const result = await query<ProjectRow>(
      `SELECT id, name, analysis_type, data_source, goal, status, created_at, workspace_id
       FROM projects
       WHERE id = $1
         AND (
           owner_id = $2
           OR EXISTS (
             SELECT 1 FROM workspace_members
             WHERE workspace_members.workspace_id = projects.workspace_id
               AND workspace_members.user_id = $2
           )
         )`,
      [projectId, ownerId]
    );

    return result.rows[0] ? mapProject(result.rows[0]) : undefined;
  }

  async updateStatus(projectId: string, status: ProjectStatus, ownerId: string) {
    const result = await query<ProjectRow>(
      `UPDATE projects SET status = $2, updated_at = now()
       WHERE id = $1
         AND (
           owner_id = $3
           OR EXISTS (
             SELECT 1 FROM workspace_members
             WHERE workspace_members.workspace_id = projects.workspace_id
               AND workspace_members.user_id = $3
               AND workspace_members.role IN ('owner', 'admin', 'analyst')
           )
         )
       RETURNING id, name, analysis_type, data_source, goal, status, created_at, workspace_id`,
      [projectId, status, ownerId]
    );

    return result.rows[0] ? mapProject(result.rows[0]) : undefined;
  }

  async update(
    projectId: string,
    updates: { analysisType?: AnalysisType; goal?: ProjectGoal; name?: string },
    ownerId: string
  ) {
    const result = await query<ProjectRow>(
      `UPDATE projects
       SET name = COALESCE($3, name),
           analysis_type = COALESCE($4, analysis_type),
           goal = COALESCE($5, goal),
           updated_at = now()
       WHERE id = $1
         AND (
           owner_id = $2
           OR EXISTS (
             SELECT 1 FROM workspace_members
             WHERE workspace_members.workspace_id = projects.workspace_id
               AND workspace_members.user_id = $2
               AND workspace_members.role IN ('owner', 'admin')
           )
         )
       RETURNING id, name, analysis_type, data_source, goal, status, created_at, workspace_id`,
      [
        projectId,
        ownerId,
        updates.name?.trim() || null,
        updates.analysisType ?? null,
        updates.goal ?? null
      ]
    );

    return result.rows[0] ? mapProject(result.rows[0]) : undefined;
  }

  async delete(projectId: string, ownerId: string) {
    const result = await query<{ id: string }>(
      `DELETE FROM projects
       WHERE id = $1
         AND (
           owner_id = $2
           OR EXISTS (
             SELECT 1 FROM workspace_members
             WHERE workspace_members.workspace_id = projects.workspace_id
               AND workspace_members.user_id = $2
               AND workspace_members.role IN ('owner', 'admin')
           )
         )
       RETURNING id`,
      [projectId, ownerId]
    );
    return Boolean(result.rows[0]);
  }

  async userOwnsProject(projectId: string, ownerId: string) {
    const result = await query<{ id: string }>(
      `SELECT id FROM projects WHERE id = $1 AND owner_id = $2`,
      [projectId, ownerId]
    );
    return Boolean(result.rows[0]);
  }
}

function mapProject(row: ProjectRow): OpinionProject {
  const project: OpinionProject = {
    id: row.id,
    name: row.name,
    analysisType: row.analysis_type,
    dataSource: row.data_source,
    goal: row.goal,
    status: row.status,
    createdAt: row.created_at.toISOString()
  };
  project.workspaceId = row.workspace_id ?? undefined;
  return project;
}
