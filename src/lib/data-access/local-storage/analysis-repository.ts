import type { AnalysisJob, AnalysisResult, MultiDimensionalAnalysisResult, PreparedDataset } from "@/types/analysis";
import type { RecommendationResult } from "@/types/recommendation";
import type { ReportExport, ReportSnapshot } from "@/types/report";
import { findAnalysisJobByProjectId, readAnalysisJobs } from "@/lib/repositories/analysis-job-repository";
import { findAnalysisResultByProjectId, readAnalysisResults } from "@/lib/repositories/analysis-result-repository";
import {
  findMultiDimensionalAnalysisByProjectId,
  readMultiDimensionalAnalysisResults
} from "@/lib/repositories/multi-dimensional-analysis-repository";
import {
  findPreparedDatasetByProjectId,
  readPreparedDatasets
} from "@/lib/repositories/prepared-dataset-repository";
import {
  findRecommendationResultByProjectId,
  readRecommendationResults
} from "@/lib/repositories/recommendation-repository";
import { findReportExportsByProjectId, readReportExports } from "@/lib/repositories/report-export-repository";
import { findReportSnapshotByProjectId, readReportSnapshots } from "@/lib/repositories/report-snapshot-repository";

export class LocalStorageAnalysisRepository {
  findJobByProjectId(projectId: string) {
    return findAnalysisJobByProjectId(projectId);
  }

  findPreparedDatasetByProjectId(projectId: string) {
    return findPreparedDatasetByProjectId(projectId);
  }

  findSentimentResultByProjectId(projectId: string) {
    return findAnalysisResultByProjectId(projectId);
  }

  findDeepAnalysisByProjectId(projectId: string) {
    return findMultiDimensionalAnalysisByProjectId(projectId);
  }

  findRecommendationsByProjectId(projectId: string) {
    return findRecommendationResultByProjectId(projectId);
  }

  findReportSnapshotByProjectId(projectId: string) {
    return findReportSnapshotByProjectId(projectId);
  }

  findReportExportsByProjectId(projectId: string) {
    return findReportExportsByProjectId(projectId);
  }

  listJobs(): AnalysisJob[] {
    return readAnalysisJobs();
  }

  listPreparedDatasets(): PreparedDataset[] {
    return readPreparedDatasets();
  }

  listSentimentResults(): AnalysisResult[] {
    return readAnalysisResults();
  }

  listDeepAnalysisResults(): MultiDimensionalAnalysisResult[] {
    return readMultiDimensionalAnalysisResults();
  }

  listRecommendationResults(): RecommendationResult[] {
    return readRecommendationResults();
  }

  listReportSnapshots(): ReportSnapshot[] {
    return readReportSnapshots();
  }

  listReportExports(): ReportExport[] {
    return readReportExports();
  }
}
