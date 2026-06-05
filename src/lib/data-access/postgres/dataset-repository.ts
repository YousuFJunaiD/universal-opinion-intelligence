import { getDbPool, query } from "@/server/db/client";
import type { Dataset, DatasetRecord, DataSourceType } from "@/types/dataset";

interface DatasetRow {
  id: string;
  project_id: string;
  source_type: DataSourceType;
  file_name: string | null;
  selected_column: string | null;
  columns: string[];
  record_count: number;
  created_at: Date;
}

interface DatasetRecordRow {
  id: string;
  dataset_id: string;
  project_id: string;
  row_index: number;
  text: string;
  source_type: DataSourceType;
  metadata: Record<string, string>;
  created_at: Date;
}

export class PostgresDatasetRepository {
  async create(dataset: Dataset, ownerId: string) {
    const client = await getDbPool().connect();

    try {
      await client.query("BEGIN");
      const projectResult = await client.query<{ id: string }>(
        `SELECT id FROM projects
         WHERE id = $1
           AND (
             owner_id = $2
             OR EXISTS (
               SELECT 1 FROM workspace_members
               WHERE workspace_members.workspace_id = projects.workspace_id
                 AND workspace_members.user_id = $2
                 AND workspace_members.role IN ('owner', 'admin', 'analyst')
             )
           )`,
        [dataset.projectId, ownerId]
      );
      if (!projectResult.rows[0]) {
        throw new Error("Project was not found for the current user.");
      }

      const datasetResult = await client.query<DatasetRow>(
        `INSERT INTO datasets (id, project_id, source_type, file_name, selected_column, columns, record_count, created_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           source_type = EXCLUDED.source_type,
           file_name = EXCLUDED.file_name,
           selected_column = EXCLUDED.selected_column,
           columns = EXCLUDED.columns,
           record_count = EXCLUDED.record_count
         RETURNING id, project_id, source_type, file_name, selected_column, columns, record_count, created_at`,
        [
          dataset.id,
          dataset.projectId,
          dataset.sourceType,
          dataset.fileName ?? null,
          dataset.selectedColumn ?? null,
          JSON.stringify(dataset.columns ?? []),
          dataset.records.length,
          dataset.createdAt
        ]
      );
      await client.query(`DELETE FROM dataset_records WHERE dataset_id = $1`, [dataset.id]);

      for (const record of dataset.records) {
        await client.query(
          `INSERT INTO dataset_records (id, dataset_id, project_id, row_index, text, source_type, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
          [
            record.id,
            dataset.id,
            dataset.projectId,
            record.rowIndex,
            record.text,
            record.sourceType,
            JSON.stringify(record.metadata ?? {}),
            record.createdAt
          ]
        );
      }

      await client.query("COMMIT");
      return {
        ...mapDataset(datasetResult.rows[0]),
        records: dataset.records
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async replaceForProject(dataset: Dataset, ownerId: string) {
    await this.deleteByProjectId(dataset.projectId, ownerId);
    return this.create(dataset, ownerId);
  }

  async findById(datasetId: string, ownerId: string) {
    const datasetResult = await query<DatasetRow>(
      `SELECT id, project_id, source_type, file_name, selected_column, columns, record_count, created_at
       FROM datasets
       WHERE id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = datasets.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )`,
      [datasetId, ownerId]
    );

    if (!datasetResult.rows[0]) {
      return undefined;
    }

    const recordResult = await query<DatasetRecordRow>(
      `SELECT id, dataset_id, project_id, row_index, text, source_type, metadata, created_at
       FROM dataset_records WHERE dataset_id = $1 ORDER BY row_index ASC`,
      [datasetId]
    );

    return {
      ...mapDataset(datasetResult.rows[0]),
      records: recordResult.rows.map(mapDatasetRecord)
    };
  }

  async findByProjectId(projectId: string, ownerId: string) {
    const datasetResult = await query<DatasetRow>(
      `SELECT id, project_id, source_type, file_name, selected_column, columns, record_count, created_at
       FROM datasets
       WHERE project_id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = datasets.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )
       ORDER BY created_at DESC`,
      [projectId, ownerId]
    );

    const datasets: Dataset[] = [];
    for (const row of datasetResult.rows) {
      const dataset = await this.findById(row.id, ownerId);
      if (dataset) {
        datasets.push(dataset);
      }
    }

    return datasets;
  }

  async deleteById(datasetId: string, ownerId: string) {
    const result = await query<{ id: string; project_id: string }>(
      `DELETE FROM datasets
       WHERE id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = datasets.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
                   AND workspace_members.role IN ('owner', 'admin', 'analyst')
               )
             )
         )
       RETURNING id, project_id`,
      [datasetId, ownerId]
    );
    return result.rows[0];
  }

  async deleteByProjectId(projectId: string, ownerId: string) {
    const result = await query<{ id: string }>(
      `DELETE FROM datasets
       WHERE project_id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = datasets.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
                   AND workspace_members.role IN ('owner', 'admin', 'analyst')
               )
             )
         )
       RETURNING id`,
      [projectId, ownerId]
    );
    return result.rows.length;
  }
}

function mapDataset(row: DatasetRow): Omit<Dataset, "records"> {
  return {
    id: row.id,
    projectId: row.project_id,
    sourceType: row.source_type,
    createdAt: row.created_at.toISOString(),
    recordCount: row.record_count,
    fileName: row.file_name ?? undefined,
    selectedColumn: row.selected_column ?? undefined,
    columns: row.columns ?? []
  };
}

function mapDatasetRecord(row: DatasetRecordRow): DatasetRecord {
  return {
    id: row.id,
    text: row.text,
    sourceType: row.source_type,
    createdAt: row.created_at.toISOString(),
    rowIndex: row.row_index,
    metadata: row.metadata
  };
}
