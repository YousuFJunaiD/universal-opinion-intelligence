"use client";

import {
  generateRecommendations as generateRecommendationsApi,
  getAnalysisResultsByProjectId,
  prepareAnalysis as prepareAnalysisApi,
  runDeepAnalysis as runDeepAnalysisApi,
  runSentimentAnalysis as runSentimentAnalysisApi
} from "@/lib/api/client";
import { DATA_MODE, runApiShadowCall } from "@/lib/data-mode";
import {
  createAnalysisJob,
  deleteAnalysisJobByProjectId,
  findAnalysisJobByProjectId,
  updateAnalysisJob
} from "@/lib/repositories/analysis-job-repository";
import {
  deleteAnalysisResultByProjectId,
  findAnalysisResultByProjectId,
  saveAnalysisResult
} from "@/lib/repositories/analysis-result-repository";
import {
  deleteMultiDimensionalAnalysisByProjectId,
  findMultiDimensionalAnalysisByProjectId,
  saveMultiDimensionalAnalysisResult
} from "@/lib/repositories/multi-dimensional-analysis-repository";
import { findPreparedDatasetByProjectId, savePreparedDataset } from "@/lib/repositories/prepared-dataset-repository";
import {
  deleteRecommendationResultByProjectId,
  findRecommendationResultByProjectId,
  saveRecommendationResult
} from "@/lib/repositories/recommendation-repository";
import { updateProjectStatus } from "@/lib/projects";
import { prepareDatasetForAnalysis } from "@/lib/services/analysis-preparation-service";
import { generateRecommendationResult } from "@/lib/services/recommendation-result-service";
import { runMultiDimensionalAnalysis } from "@/lib/services/multi-dimensional-analysis-service";
import { runRuleBasedSentimentAnalysis } from "@/lib/services/sentiment-analysis-service";
import type {
  AnalysisJob,
  AnalysisResult,
  MultiDimensionalAnalysisResult,
  PreparedDataset
} from "@/types/analysis";
import type { Dataset } from "@/types/dataset";
import type { RecommendationResult } from "@/types/recommendation";

export interface AnalysisDataState {
  analysisJob: AnalysisJob | null;
  analysisResult: AnalysisResult | null;
  deepAnalysisResult: MultiDimensionalAnalysisResult | null;
  preparedDataset: PreparedDataset | null;
  recommendationResult: RecommendationResult | null;
}

export async function getAnalysisDataForProject(projectId: string): Promise<AnalysisDataState> {
  if (DATA_MODE === "api") {
    return getAnalysisResultsByProjectId(projectId);
  }

  return {
    analysisJob: findAnalysisJobByProjectId(projectId) ?? null,
    analysisResult: findAnalysisResultByProjectId(projectId) ?? null,
    deepAnalysisResult: findMultiDimensionalAnalysisByProjectId(projectId) ?? null,
    preparedDataset: findPreparedDatasetByProjectId(projectId) ?? null,
    recommendationResult: findRecommendationResultByProjectId(projectId) ?? null
  };
}

export async function clearAnalysisDataForNewDataset(projectId: string) {
  if (DATA_MODE === "api") {
    return;
  }

  deleteAnalysisJobByProjectId(projectId);
  clearAfterPreparation(projectId);
}

export async function prepareAnalysisData(projectId: string, dataset: Dataset) {
  if (DATA_MODE === "api") {
    await prepareAnalysisApi({ projectId, datasetId: dataset.id });
    return;
  }

  clearAfterPreparation(projectId);
  const pendingJob = createAnalysisJob(projectId, dataset.id);
  const processingJob = updateAnalysisJob(pendingJob.id, { status: "processing" }) ?? pendingJob;
  try {
    const prepared = savePreparedDataset(prepareDatasetForAnalysis(dataset, processingJob));
    updateAnalysisJob(processingJob.id, {
      preparedDatasetId: prepared.id,
      status: "ready"
    });
    updateProjectStatus(projectId, "Ready for Analysis");
    runApiShadowCall(() => prepareAnalysisApi({ projectId, datasetId: dataset.id }));
  } catch (error) {
    updateAnalysisJob(processingJob.id, {
      failureReason: error instanceof Error ? error.message : "Preparation failed.",
      status: "failed"
    });
    throw error;
  }
}

export async function runSentimentAnalysisData(preparedDataset: PreparedDataset, analysisJob: AnalysisJob) {
  if (DATA_MODE === "api") {
    await runSentimentAnalysisApi({
      projectId: preparedDataset.projectId,
      datasetId: preparedDataset.datasetId,
      preparedDatasetId: preparedDataset.id
    });
    return;
  }

  const result = saveAnalysisResult(runRuleBasedSentimentAnalysis(preparedDataset, analysisJob));
  clearAfterSentiment(result.projectId);
  updateProjectStatus(result.projectId, "Analysed");
  runApiShadowCall(() =>
    runSentimentAnalysisApi({
      projectId: result.projectId,
      datasetId: result.datasetId,
      preparedDatasetId: result.preparedDatasetId,
      analysisResultId: result.id
    })
  );
}

export async function runDeepAnalysisData(preparedDataset: PreparedDataset, analysisResult: AnalysisResult) {
  if (DATA_MODE === "api") {
    await runDeepAnalysisApi({
      projectId: analysisResult.projectId,
      datasetId: analysisResult.datasetId,
      preparedDatasetId: preparedDataset.id,
      analysisResultId: analysisResult.id
    });
    return;
  }

  const result = saveMultiDimensionalAnalysisResult(runMultiDimensionalAnalysis(preparedDataset, analysisResult));
  deleteRecommendationResultByProjectId(result.projectId);
  runApiShadowCall(() =>
    runDeepAnalysisApi({
      projectId: result.projectId,
      datasetId: result.datasetId,
      preparedDatasetId: result.preparedDatasetId,
      analysisResultId: result.analysisResultId
    })
  );
}

export async function generateRecommendationData(
  analysisResult: AnalysisResult,
  deepAnalysisResult: MultiDimensionalAnalysisResult
) {
  if (DATA_MODE === "api") {
    await generateRecommendationsApi({
      projectId: analysisResult.projectId,
      datasetId: analysisResult.datasetId,
      preparedDatasetId: analysisResult.preparedDatasetId,
      analysisResultId: analysisResult.id
    });
    return;
  }

  const result = saveRecommendationResult(generateRecommendationResult(analysisResult, deepAnalysisResult));
  runApiShadowCall(() =>
    generateRecommendationsApi({
      projectId: result.projectId,
      datasetId: analysisResult.datasetId,
      preparedDatasetId: analysisResult.preparedDatasetId,
      analysisResultId: result.analysisResultId
    })
  );
}

function clearAfterPreparation(projectId: string) {
  deleteAnalysisResultByProjectId(projectId);
  clearAfterSentiment(projectId);
}

function clearAfterSentiment(projectId: string) {
  deleteMultiDimensionalAnalysisByProjectId(projectId);
  deleteRecommendationResultByProjectId(projectId);
}
