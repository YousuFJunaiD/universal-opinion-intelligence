import type {
  AnalysisPrepareRequest,
  AnalysisRunRequest,
  AnalysisStateResponse,
  ApiSuccessEnvelope,
  DatasetCreateRequest,
  DatasetListResponse,
  DatasetResponse,
  EvaluationRunRequest,
  EvaluationRunResponse,
  ApiHealthResponse,
  LocalModeApiResponse,
  ProjectCreateRequest,
  ProjectDetailResponse,
  ProjectListResponse,
  ProjectUpdateRequest,
  ProjectResponse,
  ReportCreateRequest,
  ReportExportCreateRequest,
  ReportStateResponse,
  WorkspaceCreateRequest,
  WorkspaceListResponse,
  WorkspaceMemberCreateRequest,
  WorkspaceMemberListResponse,
  WorkspaceMemberUpdateRequest,
  WorkspaceResponse
} from "@/types/api";
import type { PublicSearchResponse, UrlExtractionResult } from "@/types/research";
import { ApiClientError } from "@/lib/api/errors";

export interface ApiDiagnosticEntry {
  errorMessage?: string;
  route: string;
  status: "success" | "failure";
  timestamp: string;
}

const API_DIAGNOSTICS_KEY = "uoip.api-diagnostics.latest";
const API_DIAGNOSTICS_EVENT = "uoip-api-diagnostics-updated";

async function request<TResponse>(path: string, body: unknown) {
  try {
    const response = await fetch(path, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const payload = await response.json();

    if (!response.ok) {
      recordApiDiagnostic({
        errorMessage: payload?.error?.message ?? "API request failed.",
        route: path,
        status: "failure",
        timestamp: new Date().toISOString()
      });
      throw new ApiClientError(payload?.error?.message ?? "API request failed.", response.status, payload);
    }

    recordApiDiagnostic({
      route: path,
      status: "success",
      timestamp: new Date().toISOString()
    });

    return unwrapPayload<TResponse>(payload);
  } catch (error) {
    if (!(error instanceof ApiClientError)) {
      recordApiDiagnostic({
        errorMessage: error instanceof Error ? error.message : "Network request failed.",
        route: path,
        status: "failure",
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
}

async function get<TResponse>(path: string) {
  try {
    const response = await fetch(path);
    const payload = await response.json();

    if (!response.ok) {
      recordApiDiagnostic({
        errorMessage: payload?.error?.message ?? "API request failed.",
        route: path,
        status: "failure",
        timestamp: new Date().toISOString()
      });
      throw new ApiClientError(payload?.error?.message ?? "API request failed.", response.status, payload);
    }

    recordApiDiagnostic({
      route: path,
      status: "success",
      timestamp: new Date().toISOString()
    });

    return unwrapPayload<TResponse>(payload);
  } catch (error) {
    if (!(error instanceof ApiClientError)) {
      recordApiDiagnostic({
        errorMessage: error instanceof Error ? error.message : "Network request failed.",
        route: path,
        status: "failure",
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
}

async function patch<TResponse>(path: string, body: unknown) {
  return mutate<TResponse>(path, body, "PATCH");
}

async function deleteRequest<TResponse>(path: string) {
  try {
    const response = await fetch(path, { method: "DELETE" });
    const payload = await response.json();

    if (!response.ok) {
      recordApiDiagnostic({
        errorMessage: payload?.error?.message ?? "API request failed.",
        route: path,
        status: "failure",
        timestamp: new Date().toISOString()
      });
      throw new ApiClientError(payload?.error?.message ?? "API request failed.", response.status, payload);
    }

    recordApiDiagnostic({
      route: path,
      status: "success",
      timestamp: new Date().toISOString()
    });

    return unwrapPayload<TResponse>(payload);
  } catch (error) {
    if (!(error instanceof ApiClientError)) {
      recordApiDiagnostic({
        errorMessage: error instanceof Error ? error.message : "Network request failed.",
        route: path,
        status: "failure",
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
}

async function mutate<TResponse>(path: string, body: unknown, method: "PATCH" | "POST") {
  try {
    const response = await fetch(path, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      },
      method
    });
    const payload = await response.json();

    if (!response.ok) {
      recordApiDiagnostic({
        errorMessage: payload?.error?.message ?? "API request failed.",
        route: path,
        status: "failure",
        timestamp: new Date().toISOString()
      });
      throw new ApiClientError(payload?.error?.message ?? "API request failed.", response.status, payload);
    }

    recordApiDiagnostic({
      route: path,
      status: "success",
      timestamp: new Date().toISOString()
    });

    return unwrapPayload<TResponse>(payload);
  } catch (error) {
    if (!(error instanceof ApiClientError)) {
      recordApiDiagnostic({
        errorMessage: error instanceof Error ? error.message : "Network request failed.",
        route: path,
        status: "failure",
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
}

export function readLatestApiDiagnostic(): ApiDiagnosticEntry | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(API_DIAGNOSTICS_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ApiDiagnosticEntry;
  } catch {
    return null;
  }
}

export function subscribeToApiDiagnostics(callback: () => void) {
  window.addEventListener(API_DIAGNOSTICS_EVENT, callback);
  return () => window.removeEventListener(API_DIAGNOSTICS_EVENT, callback);
}

function recordApiDiagnostic(entry: ApiDiagnosticEntry) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(API_DIAGNOSTICS_KEY, JSON.stringify(entry));
  window.dispatchEvent(new Event(API_DIAGNOSTICS_EVENT));
}

function unwrapPayload<TResponse>(payload: TResponse | ApiSuccessEnvelope<TResponse>) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiSuccessEnvelope<TResponse>).data;
  }

  return payload as TResponse;
}

export function createProject(input: ProjectCreateRequest) {
  return request<ProjectResponse>("/api/projects", input);
}

export function updateProject(projectId: string, input: ProjectUpdateRequest) {
  return patch<ProjectResponse>(`/api/projects/${projectId}`, input);
}

export function deleteProject(projectId: string) {
  return deleteRequest<LocalModeApiResponse>(`/api/projects/${projectId}`);
}

export function createDataset(input: DatasetCreateRequest) {
  return request<DatasetResponse>("/api/datasets", input);
}

export function deleteDataset(datasetId: string) {
  return deleteRequest<LocalModeApiResponse>(`/api/datasets/${datasetId}`);
}

export function prepareAnalysis(input: AnalysisPrepareRequest) {
  return request<LocalModeApiResponse>("/api/analysis/prepare", input);
}

export function runSentimentAnalysis(input: AnalysisRunRequest) {
  return request<LocalModeApiResponse>("/api/analysis/run-sentiment", input);
}

export function runDeepAnalysis(input: AnalysisRunRequest) {
  return request<LocalModeApiResponse>("/api/analysis/run-deep", input);
}

export function generateRecommendations(input: AnalysisRunRequest) {
  return request<LocalModeApiResponse>("/api/recommendations/generate", input);
}

export function generateReportSnapshot(input: ReportCreateRequest) {
  return request<LocalModeApiResponse>("/api/reports/generate", input);
}

export function createReportExport(input: ReportExportCreateRequest) {
  return request<LocalModeApiResponse>("/api/reports/export", input);
}

export function getApiHealth() {
  return get<ApiHealthResponse>("/api/health");
}

export function createWorkspace(input: WorkspaceCreateRequest) {
  return request<WorkspaceResponse>("/api/workspaces", input);
}

export function getWorkspaces() {
  return get<WorkspaceListResponse>("/api/workspaces");
}

export function getWorkspaceMembers(workspaceId: string) {
  return get<WorkspaceMemberListResponse>(`/api/workspaces/${workspaceId}/members`);
}

export function addWorkspaceMember(workspaceId: string, input: WorkspaceMemberCreateRequest) {
  return request<WorkspaceMemberListResponse>(`/api/workspaces/${workspaceId}/members`, input);
}

export function updateWorkspaceMember(workspaceId: string, memberId: string, input: WorkspaceMemberUpdateRequest) {
  return patch<WorkspaceMemberListResponse>(`/api/workspaces/${workspaceId}/members/${memberId}`, input);
}

export function deleteWorkspaceMember(workspaceId: string, memberId: string) {
  return deleteRequest<WorkspaceMemberListResponse>(`/api/workspaces/${workspaceId}/members/${memberId}`);
}

export function getProjects() {
  return get<ProjectListResponse>("/api/projects");
}

export function getProjectById(projectId: string) {
  return get<ProjectDetailResponse>(`/api/projects/${projectId}`);
}

export function getDatasetsByProjectId(projectId: string) {
  return get<DatasetListResponse>(`/api/datasets?projectId=${encodeURIComponent(projectId)}`);
}

export function getAnalysisResultsByProjectId(projectId: string) {
  return get<AnalysisStateResponse>(`/api/analysis?projectId=${encodeURIComponent(projectId)}`);
}

export function getReportsByProjectId(projectId: string) {
  return get<ReportStateResponse>(`/api/reports?projectId=${encodeURIComponent(projectId)}`);
}

export function runModelEvaluation(input: EvaluationRunRequest) {
  return request<EvaluationRunResponse>("/api/evaluation/run", input);
}

export function extractPublicUrls(urls: string[]) {
  return request<{ results: UrlExtractionResult[]; errors: Array<{ url: string; message: string }> }>(
    "/api/research/url",
    { urls }
  );
}

export function searchPublicSources(input: {
  dateRange?: string;
  language?: string;
  query: string;
  region?: string;
}) {
  return request<PublicSearchResponse>("/api/research/search", input);
}
