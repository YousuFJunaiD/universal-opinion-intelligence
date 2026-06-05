import { query } from "@/server/db/client";
import type {
  AnalysisJob,
  AnalysisJobStatus,
  AnalysisResult,
  AnalysisProvider,
  ModelResultMetadata,
  MultiDimensionalAnalysisResult,
  PreparedDataset
} from "@/types/analysis";
import type { RecommendationResult } from "@/types/recommendation";
import type { ReportExport, ReportSnapshot } from "@/types/report";

interface AnalysisJobRow {
  id: string;
  project_id: string;
  dataset_id: string;
  prepared_dataset_id: string | null;
  status: AnalysisJobStatus;
  failure_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

interface PreparedDatasetRow {
  id: string;
  project_id: string;
  dataset_id: string;
  analysis_job_id: string;
  records: PreparedDataset["records"];
  summary: PreparedDataset["summary"];
  created_at: Date;
}

interface SentimentResultRow {
  id: string;
  project_id: string;
  dataset_id: string;
  prepared_dataset_id: string;
  analysis_job_id: string;
  engine: AnalysisResult["engine"];
  model_metadata: AnalysisResult["modelMetadata"];
  summary: AnalysisResult["summary"];
  records: AnalysisResult["records"];
  created_at: Date;
}

interface DeepAnalysisResultRow {
  id: string;
  project_id: string;
  dataset_id: string;
  analysis_result_id: string;
  prepared_dataset_id: string;
  engine: MultiDimensionalAnalysisResult["engine"];
  model_metadata: MultiDimensionalAnalysisResult["modelMetadata"];
  emotion_distribution: MultiDimensionalAnalysisResult["emotionDistribution"];
  stance_distribution: MultiDimensionalAnalysisResult["stanceDistribution"];
  aspects: MultiDimensionalAnalysisResult["aspects"];
  risk_signals: MultiDimensionalAnalysisResult["riskSignals"];
  records: MultiDimensionalAnalysisResult["records"];
  created_at: Date;
}

interface RecommendationRow {
  id: string;
  project_id: string;
  analysis_result_id: string;
  multi_dimensional_analysis_result_id: string;
  executive_action_summary: string;
  recommendations: RecommendationResult["recommendations"];
  roadmap: RecommendationResult["roadmap"];
  created_at: Date;
}

interface ReportSnapshotRow {
  id: string;
  snapshot: ReportSnapshot;
}

interface ReportExportRow {
  export_id: string;
  report_snapshot_id: string;
  project_id: string;
  export_type: ReportExport["exportType"];
  exported_at: Date;
}

export class PostgresAnalysisRepository {
  async createJob(projectId: string, datasetId: string, ownerId: string): Promise<AnalysisJob> {
    await this.ensureUserCanAccessProject(projectId, ownerId);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const result = await query<AnalysisJobRow>(
      `INSERT INTO analysis_jobs (id, project_id, dataset_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'pending', $4, $4)
       RETURNING id, project_id, dataset_id, prepared_dataset_id, status, failure_reason, created_at, updated_at`,
      [id, projectId, datasetId, now]
    );
    return mapJob(result.rows[0]);
  }

  async findJobByProjectId(projectId: string, ownerId: string) {
    const result = await query<AnalysisJobRow>(
      `SELECT id, project_id, dataset_id, prepared_dataset_id, status, failure_reason, created_at, updated_at
       FROM analysis_jobs WHERE project_id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = analysis_jobs.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectId, ownerId]
    );
    return result.rows[0] ? mapJob(result.rows[0]) : undefined;
  }

  async updateJob(jobId: string, updates: { preparedDatasetId?: string; status?: AnalysisJobStatus }, ownerId: string) {
    const current = await query<AnalysisJobRow>(
      `UPDATE analysis_jobs
       SET status = COALESCE($2, status),
           prepared_dataset_id = COALESCE($3, prepared_dataset_id),
           updated_at = now()
       WHERE id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = analysis_jobs.project_id
             AND (
               projects.owner_id = $4
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $4
                   AND workspace_members.role IN ('owner', 'admin', 'analyst')
               )
             )
         )
       RETURNING id, project_id, dataset_id, prepared_dataset_id, status, failure_reason, created_at, updated_at`,
      [jobId, updates.status ?? null, updates.preparedDatasetId ?? null, ownerId]
    );
    return current.rows[0] ? mapJob(current.rows[0]) : undefined;
  }

  async savePreparedDataset(preparedDataset: PreparedDataset, ownerId: string) {
    await this.ensureUserCanAccessProject(preparedDataset.projectId, ownerId);
    const result = await query<PreparedDatasetRow>(
      `INSERT INTO prepared_datasets (id, project_id, dataset_id, analysis_job_id, records, summary, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
       ON CONFLICT (id) DO UPDATE SET records = EXCLUDED.records, summary = EXCLUDED.summary
       RETURNING id, project_id, dataset_id, analysis_job_id, records, summary, created_at`,
      [
        preparedDataset.id,
        preparedDataset.projectId,
        preparedDataset.datasetId,
        preparedDataset.analysisJobId,
        JSON.stringify(preparedDataset.records),
        JSON.stringify(preparedDataset.summary),
        preparedDataset.createdAt
      ]
    );
    return mapPreparedDataset(result.rows[0]);
  }

  async findPreparedDatasetById(preparedDatasetId: string, ownerId: string) {
    const result = await query<PreparedDatasetRow>(
      `SELECT id, project_id, dataset_id, analysis_job_id, records, summary, created_at
       FROM prepared_datasets WHERE id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = prepared_datasets.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )`,
      [preparedDatasetId, ownerId]
    );
    return result.rows[0] ? mapPreparedDataset(result.rows[0]) : undefined;
  }

  async findPreparedDatasetByProjectId(projectId: string, ownerId: string) {
    const result = await query<PreparedDatasetRow>(
      `SELECT id, project_id, dataset_id, analysis_job_id, records, summary, created_at
       FROM prepared_datasets WHERE project_id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = prepared_datasets.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectId, ownerId]
    );
    return result.rows[0] ? mapPreparedDataset(result.rows[0]) : undefined;
  }

  async saveSentimentResult(analysisResult: AnalysisResult, ownerId: string) {
    await this.ensureUserCanAccessProject(analysisResult.projectId, ownerId);
    const result = await query<SentimentResultRow>(
      `INSERT INTO sentiment_results
       (id, project_id, dataset_id, prepared_dataset_id, analysis_job_id, engine, model_metadata, summary, records, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10)
       ON CONFLICT (id) DO UPDATE SET summary = EXCLUDED.summary, records = EXCLUDED.records, model_metadata = EXCLUDED.model_metadata
       RETURNING id, project_id, dataset_id, prepared_dataset_id, analysis_job_id, engine, model_metadata, summary, records, created_at`,
      [
        analysisResult.id,
        analysisResult.projectId,
        analysisResult.datasetId,
        analysisResult.preparedDatasetId,
        analysisResult.analysisJobId,
        analysisResult.engine,
        JSON.stringify(analysisResult.modelMetadata),
        JSON.stringify(analysisResult.summary),
        JSON.stringify(analysisResult.records),
        analysisResult.createdAt
      ]
    );
    return mapSentimentResult(result.rows[0]);
  }

  async findSentimentResultById(analysisResultId: string, ownerId: string) {
    const result = await query<SentimentResultRow>(
      `SELECT id, project_id, dataset_id, prepared_dataset_id, analysis_job_id, engine, model_metadata, summary, records, created_at
       FROM sentiment_results WHERE id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = sentiment_results.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )`,
      [analysisResultId, ownerId]
    );
    return result.rows[0] ? mapSentimentResult(result.rows[0]) : undefined;
  }

  async findSentimentResultByProjectId(projectId: string, ownerId: string) {
    const result = await query<SentimentResultRow>(
      `SELECT id, project_id, dataset_id, prepared_dataset_id, analysis_job_id, engine, model_metadata, summary, records, created_at
       FROM sentiment_results WHERE project_id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = sentiment_results.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectId, ownerId]
    );
    return result.rows[0] ? mapSentimentResult(result.rows[0]) : undefined;
  }

  async saveDeepAnalysisResult(resultValue: MultiDimensionalAnalysisResult, ownerId: string) {
    await this.ensureUserCanAccessProject(resultValue.projectId, ownerId);
    const result = await query<DeepAnalysisResultRow>(
      `INSERT INTO deep_analysis_results
       (id, project_id, dataset_id, analysis_result_id, prepared_dataset_id, engine, model_metadata, emotion_distribution, stance_distribution, aspects, risk_signals, records, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13)
       ON CONFLICT (id) DO UPDATE SET
         model_metadata = EXCLUDED.model_metadata,
         emotion_distribution = EXCLUDED.emotion_distribution,
         stance_distribution = EXCLUDED.stance_distribution,
         aspects = EXCLUDED.aspects,
         risk_signals = EXCLUDED.risk_signals,
         records = EXCLUDED.records
       RETURNING id, project_id, dataset_id, analysis_result_id, prepared_dataset_id, engine, model_metadata, emotion_distribution, stance_distribution, aspects, risk_signals, records, created_at`,
      [
        resultValue.id,
        resultValue.projectId,
        resultValue.datasetId,
        resultValue.analysisResultId,
        resultValue.preparedDatasetId,
        resultValue.engine,
        JSON.stringify(resultValue.modelMetadata),
        JSON.stringify(resultValue.emotionDistribution),
        JSON.stringify(resultValue.stanceDistribution),
        JSON.stringify(resultValue.aspects),
        JSON.stringify(resultValue.riskSignals),
        JSON.stringify(resultValue.records),
        resultValue.createdAt
      ]
    );
    return mapDeepAnalysisResult(result.rows[0]);
  }

  async findDeepAnalysisResultById(deepAnalysisResultId: string, ownerId: string) {
    const result = await query<DeepAnalysisResultRow>(
      `SELECT id, project_id, dataset_id, analysis_result_id, prepared_dataset_id, engine, model_metadata, emotion_distribution, stance_distribution, aspects, risk_signals, records, created_at
       FROM deep_analysis_results WHERE id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = deep_analysis_results.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )`,
      [deepAnalysisResultId, ownerId]
    );
    return result.rows[0] ? mapDeepAnalysisResult(result.rows[0]) : undefined;
  }

  async findDeepAnalysisResultByProjectId(projectId: string, ownerId: string) {
    const result = await query<DeepAnalysisResultRow>(
      `SELECT id, project_id, dataset_id, analysis_result_id, prepared_dataset_id, engine, model_metadata, emotion_distribution, stance_distribution, aspects, risk_signals, records, created_at
       FROM deep_analysis_results WHERE project_id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = deep_analysis_results.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectId, ownerId]
    );
    return result.rows[0] ? mapDeepAnalysisResult(result.rows[0]) : undefined;
  }

  async findDeepAnalysisResultByAnalysisResultId(analysisResultId: string, ownerId: string) {
    const result = await query<DeepAnalysisResultRow>(
      `SELECT id, project_id, dataset_id, analysis_result_id, prepared_dataset_id, engine, model_metadata, emotion_distribution, stance_distribution, aspects, risk_signals, records, created_at
       FROM deep_analysis_results WHERE analysis_result_id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = deep_analysis_results.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [analysisResultId, ownerId]
    );
    return result.rows[0] ? mapDeepAnalysisResult(result.rows[0]) : undefined;
  }

  async saveRecommendationResult(recommendationResult: RecommendationResult, ownerId: string) {
    await this.ensureUserCanAccessProject(recommendationResult.projectId, ownerId);
    const result = await query<RecommendationRow>(
      `INSERT INTO recommendations
       (id, project_id, analysis_result_id, multi_dimensional_analysis_result_id, executive_action_summary, recommendations, roadmap, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
       ON CONFLICT (id) DO UPDATE SET
         executive_action_summary = EXCLUDED.executive_action_summary,
         recommendations = EXCLUDED.recommendations,
         roadmap = EXCLUDED.roadmap
       RETURNING id, project_id, analysis_result_id, multi_dimensional_analysis_result_id, executive_action_summary, recommendations, roadmap, created_at`,
      [
        recommendationResult.id,
        recommendationResult.projectId,
        recommendationResult.analysisResultId,
        recommendationResult.multiDimensionalAnalysisResultId,
        recommendationResult.executiveActionSummary,
        JSON.stringify(recommendationResult.recommendations),
        JSON.stringify(recommendationResult.roadmap),
        recommendationResult.createdAt
      ]
    );
    return mapRecommendationResult(result.rows[0]);
  }

  async findRecommendationResultById(recommendationResultId: string, ownerId: string) {
    const result = await query<RecommendationRow>(
      `SELECT id, project_id, analysis_result_id, multi_dimensional_analysis_result_id, executive_action_summary, recommendations, roadmap, created_at
       FROM recommendations WHERE id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = recommendations.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )`,
      [recommendationResultId, ownerId]
    );
    return result.rows[0] ? mapRecommendationResult(result.rows[0]) : undefined;
  }

  async findRecommendationResultByProjectId(projectId: string, ownerId: string) {
    const result = await query<RecommendationRow>(
      `SELECT id, project_id, analysis_result_id, multi_dimensional_analysis_result_id, executive_action_summary, recommendations, roadmap, created_at
       FROM recommendations WHERE project_id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = recommendations.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectId, ownerId]
    );
    return result.rows[0] ? mapRecommendationResult(result.rows[0]) : undefined;
  }

  async saveReportSnapshot(snapshot: ReportSnapshot, ownerId: string) {
    await this.ensureUserCanAccessProject(snapshot.projectId, ownerId);
    const result = await query<ReportSnapshotRow>(
      `INSERT INTO report_snapshots
       (id, project_id, dataset_id, analysis_result_id, prepared_dataset_id, snapshot, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       ON CONFLICT (id) DO UPDATE SET snapshot = EXCLUDED.snapshot
       RETURNING id, snapshot`,
      [
        snapshot.id,
        snapshot.projectId,
        snapshot.datasetId,
        snapshot.analysisResultId,
        snapshot.preparedDatasetId,
        JSON.stringify(snapshot),
        snapshot.createdAt
      ]
    );
    return result.rows[0].snapshot;
  }

  async findReportSnapshotByProjectId(projectId: string, ownerId: string) {
    const result = await query<ReportSnapshotRow>(
      `SELECT id, snapshot
       FROM report_snapshots WHERE project_id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = report_snapshots.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectId, ownerId]
    );
    return result.rows[0]?.snapshot;
  }

  async saveReportExport(reportExport: ReportExport, ownerId: string) {
    await this.ensureUserCanAccessProject(reportExport.projectId, ownerId);
    const result = await query<ReportExportRow>(
      `INSERT INTO report_exports (export_id, report_snapshot_id, project_id, export_type, exported_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING export_id, report_snapshot_id, project_id, export_type, exported_at`,
      [
        reportExport.exportId,
        reportExport.reportSnapshotId,
        reportExport.projectId,
        reportExport.exportType,
        reportExport.exportedAt
      ]
    );
    return mapReportExport(result.rows[0]);
  }

  async findReportExportsByProjectId(projectId: string, ownerId: string) {
    const result = await query<ReportExportRow>(
      `SELECT export_id, report_snapshot_id, project_id, export_type, exported_at
       FROM report_exports WHERE project_id = $1
         AND EXISTS (
           SELECT 1 FROM projects
           WHERE projects.id = report_exports.project_id
             AND (
               projects.owner_id = $2
               OR EXISTS (
                 SELECT 1 FROM workspace_members
                 WHERE workspace_members.workspace_id = projects.workspace_id
                   AND workspace_members.user_id = $2
               )
             )
         )
       ORDER BY exported_at DESC`,
      [projectId, ownerId]
    );
    return result.rows.map(mapReportExport);
  }

  private async ensureUserCanAccessProject(projectId: string, ownerId: string) {
    const result = await query<{ id: string }>(
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
      [projectId, ownerId]
    );
    if (!result.rows[0]) {
      throw new Error("Project was not found for the current user.");
    }
  }
}

function mapJob(row: AnalysisJobRow): AnalysisJob {
  return {
    id: row.id,
    projectId: row.project_id,
    datasetId: row.dataset_id,
    preparedDatasetId: row.prepared_dataset_id ?? undefined,
    status: row.status,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    failureReason: row.failure_reason ?? undefined
  };
}

function mapPreparedDataset(row: PreparedDatasetRow): PreparedDataset {
  return {
    id: row.id,
    projectId: row.project_id,
    datasetId: row.dataset_id,
    analysisJobId: row.analysis_job_id,
    createdAt: toIsoString(row.created_at),
    records: parseJsonb(row.records, []),
    summary: parseJsonb(row.summary, fallbackPreparationSummary())
  };
}

function mapSentimentResult(row: SentimentResultRow): AnalysisResult {
  return {
    id: row.id,
    projectId: row.project_id,
    datasetId: row.dataset_id,
    preparedDatasetId: row.prepared_dataset_id,
    analysisJobId: row.analysis_job_id,
    createdAt: toIsoString(row.created_at),
    engine: row.engine,
    modelMetadata: coerceModelMetadata(row.model_metadata, providerFromEngine(row.engine)),
    summary: parseJsonb(row.summary, fallbackSentimentSummary()),
    records: parseJsonb(row.records, [])
  };
}

function mapDeepAnalysisResult(row: DeepAnalysisResultRow): MultiDimensionalAnalysisResult {
  return {
    id: row.id,
    projectId: row.project_id,
    datasetId: row.dataset_id,
    analysisResultId: row.analysis_result_id,
    preparedDatasetId: row.prepared_dataset_id,
    createdAt: toIsoString(row.created_at),
    engine: row.engine,
    modelMetadata: coerceModelMetadata(row.model_metadata, providerFromEngine(row.engine)),
    emotionDistribution: parseJsonb(row.emotion_distribution, fallbackEmotionDistribution()),
    stanceDistribution: parseJsonb(row.stance_distribution, fallbackStanceDistribution()),
    aspects: parseJsonb(row.aspects, []),
    riskSignals: parseJsonb(row.risk_signals, []),
    records: parseJsonb(row.records, [])
  };
}

function defaultModelMetadata(provider: AnalysisProvider): ModelResultMetadata {
  return {
    provider,
    modelName: provider === "fastapi" ? "FastAPI ML Adapter" : provider === "azure" ? "Azure ML Adapter" : "Rule-Based Baseline",
    modelVersion: "1.0.0",
    confidence: 0,
    processingTimeMs: 0
  };
}

function mapRecommendationResult(row: RecommendationRow): RecommendationResult {
  return {
    id: row.id,
    projectId: row.project_id,
    analysisResultId: row.analysis_result_id,
    multiDimensionalAnalysisResultId: row.multi_dimensional_analysis_result_id,
    createdAt: toIsoString(row.created_at),
    executiveActionSummary: row.executive_action_summary,
    recommendations: parseJsonb(row.recommendations, []),
    roadmap: parseJsonb(row.roadmap, fallbackActionRoadmap(row.project_id))
  };
}

function mapReportExport(row: ReportExportRow): ReportExport {
  return {
    exportId: row.export_id,
    reportSnapshotId: row.report_snapshot_id,
    projectId: row.project_id,
    exportType: row.export_type,
    exportedAt: toIsoString(row.exported_at)
  };
}

function coerceModelMetadata(value: unknown, provider: AnalysisProvider): ModelResultMetadata {
  const parsed = parseJsonb<Partial<ModelResultMetadata>>(value, {});
  return {
    ...defaultModelMetadata(provider),
    ...parsed,
    provider: parsed.provider ?? provider,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    processingTimeMs: typeof parsed.processingTimeMs === "number" ? parsed.processingTimeMs : 0
  };
}

function parseJsonb<TValue>(value: unknown, fallback: TValue): TValue {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as TValue;
    } catch {
      return fallback;
    }
  }

  return value as TValue;
}

function providerFromEngine(engine: string): AnalysisProvider {
  if (engine.startsWith("fastapi")) {
    return "fastapi";
  }

  if (engine.startsWith("azure")) {
    return "azure";
  }

  return "rule-based";
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function fallbackSentimentSummary() {
  return {
    negativeCount: 0,
    negativePercentage: 0,
    neutralCount: 0,
    neutralPercentage: 0,
    positiveCount: 0,
    positivePercentage: 0,
    totalAnalysed: 0
  };
}

function fallbackPreparationSummary() {
  return {
    cleanRecords: 0,
    language: "unknown" as const,
    originalRecords: 0,
    quality: {
      averageTextLength: 0,
      duplicateCount: 0,
      emptyRemovedCount: 0,
      longestTextLength: 0,
      shortestTextLength: 0,
      totalRecords: 0
    },
    readinessScore: 0,
    removedDuplicates: 0,
    removedEmptyRecords: 0
  };
}

function fallbackEmotionDistribution() {
  return {
    anger: 0,
    fear: 0,
    joy: 0,
    neutral: 0,
    sadness: 0,
    surprise: 0,
    trust: 0
  };
}

function fallbackStanceDistribution() {
  return {
    neutral: 0,
    opposing: 0,
    questioning: 0,
    supportive: 0
  };
}

function fallbackActionRoadmap(projectId: string) {
  return {
    generatedAt: new Date(0).toISOString(),
    id: "unavailable",
    longTerm: [],
    projectId,
    sevenDay: [],
    thirtyDay: []
  };
}
