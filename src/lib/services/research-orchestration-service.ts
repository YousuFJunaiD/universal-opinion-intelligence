"use client";

import { extractPublicUrls } from "@/lib/api/client";
import {
  generateRecommendationData,
  getAnalysisDataForProject,
  prepareAnalysisData,
  runDeepAnalysisData,
  runSentimentAnalysisData
} from "@/lib/data-services/analysis-data-service";
import { saveDatasetData } from "@/lib/data-services/dataset-data-service";
import { createProjectData } from "@/lib/data-services/project-data-service";
import { generateReportSnapshotData } from "@/lib/data-services/report-data-service";
import { buildResearchPlan, runPublicResearchProvider } from "@/lib/research/research-provider";
import {
  mapIntentToAnalysisType,
  mapResearchSourceToProjectSource,
  type ConversationalAnalysisRequest,
  type OrchestrationProgressStep,
  type OrchestrationResult,
  type PublicResearchRecord
} from "@/types/research";
import type { Dataset, DatasetRecord } from "@/types/dataset";

export const ORCHESTRATION_STEPS: OrchestrationProgressStep[] = [
  { key: "planning", label: "Planning research", status: "pending" },
  { key: "collecting", label: "Collecting available data", status: "pending" },
  { key: "cleaning", label: "Cleaning dataset", status: "pending" },
  { key: "sentiment", label: "Running sentiment analysis", status: "pending" },
  { key: "deep-analysis", label: "Running deep analysis", status: "pending" },
  { key: "recommendations", label: "Generating roadmap", status: "pending" },
  { key: "report", label: "Generating report", status: "pending" },
  { key: "ready", label: "Ready", status: "pending" }
];

export async function runResearchToReportOrchestration(
  request: ConversationalAnalysisRequest,
  onStep?: (key: OrchestrationProgressStep["key"], status: OrchestrationProgressStep["status"]) => void
): Promise<OrchestrationResult> {
  const limitations: string[] = [];

  onStep?.("planning", "active");
  const plan = buildResearchPlan({
    dateRange: request.dateRange,
    expectedOutput: request.expectedOutput,
    intent: request.intent,
    language: request.language,
    platform: request.platform,
    region: request.region,
    subject: request.subject,
    targetSources: [request.dataSource]
  });
  limitations.push(...plan.limitations);
  onStep?.("planning", "complete");

  onStep?.("collecting", "active");
  const researchRecords: PublicResearchRecord[] = [];

  if (request.dataSource === "public-web" || request.dataSource === "mixed") {
    const providerResult = await runPublicResearchProvider(plan);
    limitations.push(...providerResult.limitations);
    researchRecords.push(...providerResult.records);
  }

  if (request.manualText.trim()) {
    researchRecords.push(...manualTextToRecords(request.manualText));
  }

  const urls = parseUrls(request.urls);
  if (urls.length) {
    const extraction = await extractPublicUrls(urls);
    extraction.results.forEach((result) => {
      researchRecords.push(...result.records);
      limitations.push(...result.limitations.map((limitation) => `${result.url}: ${limitation}`));
    });
    extraction.errors.forEach((error) => limitations.push(`${error.url}: ${error.message}`));
  }

  if (researchRecords.length === 0) {
    onStep?.("collecting", "failed");
    throw new Error("No analysable public, URL, CSV, or manual text data was provided. Paste text, upload CSV in the project page, or provide public URLs.");
  }
  onStep?.("collecting", "complete");

  const project = await createProjectData({
    name: request.subject.trim() || `${request.intent} research report`,
    analysisType: mapIntentToAnalysisType(request.intent),
    dataSource: mapResearchSourceToProjectSource(request.dataSource),
    goal: request.goal
  });

  const dataset = await saveDatasetData(buildResearchDataset(project.id, researchRecords, limitations));

  onStep?.("cleaning", "active");
  await prepareAnalysisData(project.id, dataset);
  let analysisState = await getAnalysisDataForProject(project.id);
  if (!analysisState.preparedDataset || !analysisState.analysisJob) {
    onStep?.("cleaning", "failed");
    throw new Error("Analysis preparation did not produce a prepared dataset.");
  }
  const preparedDataset = analysisState.preparedDataset;
  const analysisJob = analysisState.analysisJob;
  onStep?.("cleaning", "complete");

  onStep?.("sentiment", "active");
  await runSentimentAnalysisData(preparedDataset, analysisJob);
  analysisState = await getAnalysisDataForProject(project.id);
  if (!analysisState.analysisResult) {
    onStep?.("sentiment", "failed");
    throw new Error("Sentiment analysis did not produce an analysis result.");
  }
  const analysisResult = analysisState.analysisResult;
  onStep?.("sentiment", "complete");

  onStep?.("deep-analysis", "active");
  await runDeepAnalysisData(preparedDataset, analysisResult);
  analysisState = await getAnalysisDataForProject(project.id);
  if (!analysisState.deepAnalysisResult) {
    onStep?.("deep-analysis", "failed");
    throw new Error("Deep analysis did not produce a result.");
  }
  const deepAnalysisResult = analysisState.deepAnalysisResult;
  onStep?.("deep-analysis", "complete");

  if (request.expectedOutput === "report-and-roadmap") {
    onStep?.("recommendations", "active");
    await generateRecommendationData(analysisResult, deepAnalysisResult);
    analysisState = await getAnalysisDataForProject(project.id);
    onStep?.("recommendations", "complete");
  } else {
    onStep?.("recommendations", "complete");
  }

  onStep?.("report", "active");
  await generateReportSnapshotData({
    analysisResult,
    dataset,
    deepAnalysisResult,
    preparedDataset,
    project,
    recommendationResult: analysisState.recommendationResult
  });
  onStep?.("report", "complete");
  onStep?.("ready", "complete");

  return {
    projectId: project.id,
    reportReady: true,
    limitations: unique(limitations)
  };
}

function manualTextToRecords(input: string): PublicResearchRecord[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => ({
      id: crypto.randomUUID(),
      text,
      metadata: {
        recordType: "manual-text"
      }
    }));
}

function parseUrls(input: string) {
  return input
    .split(/\s|,/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function buildResearchDataset(projectId: string, records: PublicResearchRecord[], limitations: string[]): Dataset {
  const createdAt = new Date().toISOString();
  const datasetRecords: DatasetRecord[] = records.map((record, index) => ({
    id: record.id,
    text: record.text,
    sourceType: "paste_text",
    createdAt,
    rowIndex: index,
    metadata: {
      ...record.metadata,
      sourceUrl: record.sourceUrl ?? record.metadata.sourceUrl ?? "",
      sourceTitle: record.sourceTitle ?? record.metadata.sourceTitle ?? "",
      limitations: limitations.join(" | ")
    }
  }));

  return {
    id: crypto.randomUUID(),
    projectId,
    sourceType: "paste_text",
    createdAt,
    recordCount: datasetRecords.length,
    records: datasetRecords,
    selectedColumn: "text",
    columns: ["text", "sourceUrl", "sourceTitle", "recordType", "limitations"]
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
