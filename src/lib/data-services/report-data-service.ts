"use client";

import {
  createReportExport as createReportExportApi,
  generateReportSnapshot as generateReportSnapshotApi,
  getReportsByProjectId
} from "@/lib/api/client";
import { DATA_MODE, runApiShadowCall } from "@/lib/data-mode";
import {
  deleteReportExportsByProjectId,
  findReportExportsByProjectId,
  saveReportExport
} from "@/lib/repositories/report-export-repository";
import {
  deleteReportSnapshotByProjectId,
  findReportSnapshotByProjectId,
  saveReportSnapshot
} from "@/lib/repositories/report-snapshot-repository";
import { updateProjectStatus } from "@/lib/projects";
import { createReportExport } from "@/lib/services/report-export-service";
import { generateReportSnapshot } from "@/lib/services/report-generation-service";
import type { AnalysisResult, MultiDimensionalAnalysisResult, PreparedDataset } from "@/types/analysis";
import type { Dataset } from "@/types/dataset";
import type { OpinionProject } from "@/types/project";
import type { RecommendationResult } from "@/types/recommendation";
import type { ReportExport, ReportSnapshot } from "@/types/report";

export interface ReportDataState {
  reportExports: ReportExport[];
  reportSnapshot: ReportSnapshot | null;
}

export async function getReportDataForProject(projectId: string): Promise<ReportDataState> {
  if (DATA_MODE === "api") {
    return getReportsByProjectId(projectId);
  }

  const reportSnapshot = findReportSnapshotByProjectId(projectId) ?? null;
  return {
    reportSnapshot,
    reportExports: reportSnapshot
      ? findReportExportsByProjectId(projectId).filter((item) => item.reportSnapshotId === reportSnapshot.id)
      : []
  };
}

export async function clearReportData(projectId: string) {
  if (DATA_MODE === "api") {
    return;
  }

  deleteReportSnapshotByProjectId(projectId);
  deleteReportExportsByProjectId(projectId);
}

export async function generateReportSnapshotData({
  analysisResult,
  dataset,
  deepAnalysisResult,
  preparedDataset,
  project,
  recommendationResult
}: {
  analysisResult: AnalysisResult;
  dataset: Dataset;
  deepAnalysisResult: MultiDimensionalAnalysisResult | null;
  preparedDataset: PreparedDataset;
  project: OpinionProject;
  recommendationResult: RecommendationResult | null;
}) {
  if (DATA_MODE === "api") {
    await generateReportSnapshotApi({
      projectId: project.id,
      datasetId: dataset.id,
      analysisResultId: analysisResult.id,
      preparedDatasetId: preparedDataset.id,
      multiDimensionalAnalysisResultId: deepAnalysisResult?.id,
      recommendationResultId: recommendationResult?.id
    });
    return;
  }

  const snapshot = saveReportSnapshot(
    generateReportSnapshot({
      analysisResult,
      dataset,
      deepAnalysisResult,
      preparedDataset,
      project,
      recommendationResult
    })
  );
  updateProjectStatus(project.id, "Report Ready");
  runApiShadowCall(() =>
    generateReportSnapshotApi({
      projectId: snapshot.projectId,
      datasetId: snapshot.datasetId,
      analysisResultId: snapshot.analysisResultId,
      preparedDatasetId: snapshot.preparedDatasetId,
      multiDimensionalAnalysisResultId: deepAnalysisResult?.id,
      recommendationResultId: recommendationResult?.id
    })
  );
}

export async function createReportExportData(snapshot: ReportSnapshot) {
  const reportExport = createReportExport(snapshot);

  if (DATA_MODE === "api") {
    await createReportExportApi(reportExport);
    return reportExport;
  }

  const savedExport = saveReportExport(reportExport);
  runApiShadowCall(() => createReportExportApi(savedExport));
  return savedExport;
}
