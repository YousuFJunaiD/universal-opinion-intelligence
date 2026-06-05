import type { AnalysisType, DataSource, ProjectGoal, ProjectStatus } from "@/types/project";
import type { DataSourceType } from "@/types/dataset";
import type { AnalysisJob, AnalysisResult, MultiDimensionalAnalysisResult, PreparedDataset } from "@/types/analysis";
import type { Dataset } from "@/types/dataset";
import type { OpinionProject } from "@/types/project";
import type { RecommendationResult } from "@/types/recommendation";
import type { ReportExport, ReportSnapshot } from "@/types/report";
import type { AuthMode, AuthUser } from "@/types/auth";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "@/types/workspace";
import type { EvaluationRunRequest, EvaluationRunResponse } from "@/types/evaluation";

export interface ProjectCreateRequest {
  id?: string;
  name: string;
  analysisType: AnalysisType;
  dataSource: DataSource;
  goal: ProjectGoal;
  workspaceId?: string;
}

export interface ProjectUpdateRequest {
  analysisType?: AnalysisType;
  goal?: ProjectGoal;
  name?: string;
}

export interface ProjectResponse {
  id?: string;
  name?: string;
  analysisType?: AnalysisType;
  dataSource?: DataSource;
  goal?: ProjectGoal;
  status?: ProjectStatus;
  mode: "local" | "api";
  persisted: boolean;
  message: string;
  workspaceId?: string;
}

export interface WorkspaceCreateRequest {
  name: string;
}

export interface WorkspaceListResponse {
  workspaces: Workspace[];
}

export interface WorkspaceResponse {
  message: string;
  persisted: boolean;
  workspace: Workspace;
}

export interface WorkspaceMemberCreateRequest {
  email: string;
  role: WorkspaceRole;
  userId?: string;
}

export interface WorkspaceMemberUpdateRequest {
  role: WorkspaceRole;
}

export interface WorkspaceMemberListResponse {
  members: WorkspaceMember[];
}

export interface DatasetCreateRequest {
  id?: string;
  projectId: string;
  sourceType: DataSourceType;
  records: string[];
  fileName?: string;
  selectedColumn?: string;
  columns?: string[];
}

export interface DatasetResponse {
  datasetId?: string;
  projectId?: string;
  recordCount?: number;
  mode: "local" | "api";
  persisted: boolean;
  message: string;
}

export interface ProjectListResponse {
  projects: OpinionProject[];
}

export interface ProjectDetailResponse {
  project: OpinionProject | null;
}

export interface DatasetListResponse {
  datasets: Dataset[];
}

export interface AnalysisStateResponse {
  analysisJob: AnalysisJob | null;
  analysisResult: AnalysisResult | null;
  deepAnalysisResult: MultiDimensionalAnalysisResult | null;
  preparedDataset: PreparedDataset | null;
  recommendationResult: RecommendationResult | null;
}

export interface ReportStateResponse {
  reportExports: ReportExport[];
  reportSnapshot: ReportSnapshot | null;
}

export interface ReportExportCreateRequest {
  exportId: string;
  reportSnapshotId: string;
  projectId: string;
  exportedAt: string;
  exportType: "pdf-print";
}

export interface AnalysisPrepareRequest {
  projectId: string;
  datasetId: string;
}

export interface AnalysisRunRequest {
  projectId: string;
  datasetId: string;
  preparedDatasetId?: string;
  analysisResultId?: string;
}

export interface ReportCreateRequest {
  projectId: string;
  datasetId: string;
  analysisResultId: string;
  preparedDatasetId: string;
  multiDimensionalAnalysisResultId?: string;
  recommendationResultId?: string;
}

export interface LocalModeApiResponse {
  mode: "local" | "api";
  persisted: boolean;
  message: string;
  received?: unknown;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId: string;
  };
}

export interface ApiSuccessEnvelope<TData> {
  data: TData;
  timestamp: string;
  requestId: string;
}

export interface ApiHealthResponse {
  authMode: AuthMode;
  currentUser?: Pick<AuthUser, "email" | "id"> | null;
  error?: string;
  mode: "local" | "api-shadow" | "api";
  status: "available" | "unavailable";
  timestamp: string;
}

export type { EvaluationRunRequest, EvaluationRunResponse };
