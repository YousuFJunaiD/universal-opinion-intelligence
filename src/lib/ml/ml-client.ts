import type {
  AnalysisJob,
  AnalysisResult,
  DeepAnalysisRecordResult,
  ModelResultMetadata,
  MultiDimensionalAnalysisResult,
  PreparedDataset,
  SentimentRecordResult,
  SentimentSummary
} from "@/types/analysis";
import { getFastApiMlUrl } from "@/lib/ml/analysis-provider";

const ML_TIMEOUT_MS = 8000;

interface FastApiSentimentResponse {
  modelName: string;
  modelVersion: string;
  confidence: number;
  summary: SentimentSummary;
  records: SentimentRecordResult[];
}

interface FastApiDeepResponse {
  modelName: string;
  modelVersion: string;
  confidence: number;
  emotionDistribution: MultiDimensionalAnalysisResult["emotionDistribution"];
  stanceDistribution: MultiDimensionalAnalysisResult["stanceDistribution"];
  aspects: MultiDimensionalAnalysisResult["aspects"];
  riskSignals: MultiDimensionalAnalysisResult["riskSignals"];
  records: DeepAnalysisRecordResult[];
}

export async function runFastApiSentiment(
  preparedDataset: PreparedDataset,
  analysisJob: AnalysisJob
): Promise<AnalysisResult> {
  const startedAt = Date.now();
  const response = await postToFastApi<FastApiSentimentResponse>("/analyze/sentiment", {
    analysisJobId: analysisJob.id,
    datasetId: preparedDataset.datasetId,
    preparedDatasetId: preparedDataset.id,
    projectId: preparedDataset.projectId,
    records: preparedDataset.records.map((record) => ({ id: record.id, text: record.text }))
  });

  return {
    id: crypto.randomUUID(),
    projectId: preparedDataset.projectId,
    datasetId: preparedDataset.datasetId,
    preparedDatasetId: preparedDataset.id,
    analysisJobId: analysisJob.id,
    createdAt: new Date().toISOString(),
    engine: "fastapi_sentiment",
    modelMetadata: {
      provider: "fastapi",
      modelName: response.modelName,
      modelVersion: response.modelVersion,
      confidence: response.confidence,
      processingTimeMs: Date.now() - startedAt
    },
    summary: response.summary,
    records: response.records
  };
}

export async function runFastApiDeepAnalysis(
  preparedDataset: PreparedDataset,
  analysisResult: AnalysisResult
): Promise<MultiDimensionalAnalysisResult> {
  const startedAt = Date.now();
  const response = await postToFastApi<FastApiDeepResponse>("/analyze/deep", {
    analysisResultId: analysisResult.id,
    datasetId: preparedDataset.datasetId,
    preparedDatasetId: preparedDataset.id,
    projectId: preparedDataset.projectId,
    records: preparedDataset.records.map((record) => ({ id: record.id, text: record.text })),
    sentimentRecords: analysisResult.records
  });

  return {
    id: crypto.randomUUID(),
    projectId: preparedDataset.projectId,
    datasetId: preparedDataset.datasetId,
    analysisResultId: analysisResult.id,
    preparedDatasetId: preparedDataset.id,
    createdAt: new Date().toISOString(),
    engine: "fastapi_deep_analysis",
    modelMetadata: {
      provider: "fastapi",
      modelName: response.modelName,
      modelVersion: response.modelVersion,
      confidence: response.confidence,
      processingTimeMs: Date.now() - startedAt
    },
    emotionDistribution: response.emotionDistribution,
    stanceDistribution: response.stanceDistribution,
    aspects: response.aspects,
    riskSignals: response.riskSignals,
    records: response.records
  };
}

async function postToFastApi<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const baseUrl = getFastApiMlUrl();
  if (!baseUrl) {
    throw new Error("FASTAPI_ML_URL is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`FastAPI ML request failed with ${response.status}.`);
    }

    return (await response.json()) as TResponse;
  } finally {
    clearTimeout(timeout);
  }
}

export function buildFallbackMetadata({
  fallbackFrom,
  fallbackReason,
  processingTimeMs
}: {
  fallbackFrom?: ModelResultMetadata["provider"];
  fallbackReason?: string;
  processingTimeMs: number;
}): ModelResultMetadata {
  return {
    provider: "rule-based",
    modelName: "Rule-Based Baseline",
    modelVersion: "1.0.0",
    confidence: 0,
    processingTimeMs,
    fallbackFrom,
    fallbackReason
  };
}
