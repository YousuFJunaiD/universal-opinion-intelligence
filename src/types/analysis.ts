import type { DatasetRecord } from "@/types/dataset";

export type AnalysisJobStatus = "pending" | "processing" | "ready" | "failed";

export type AnalysisProvider = "rule-based" | "fastapi" | "azure";

export interface ModelResultMetadata {
  provider: AnalysisProvider;
  modelName: string;
  modelVersion: string;
  confidence: number;
  processingTimeMs: number;
  fallbackFrom?: AnalysisProvider;
  fallbackReason?: string;
}

export interface ModelEvaluationSummary {
  accuracy: null;
  precision: null;
  recall: null;
  f1: null;
  confusionMatrix: null;
  benchmarkDatasetName: null;
  evaluatedAt: null;
}

export interface AnalysisJob {
  id: string;
  projectId: string;
  datasetId: string;
  preparedDatasetId?: string;
  status: AnalysisJobStatus;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
}

export interface DatasetQualitySummary {
  totalRecords: number;
  duplicateCount: number;
  emptyRemovedCount: number;
  averageTextLength: number;
  shortestTextLength: number;
  longestTextLength: number;
}

export interface PreparationSummary {
  originalRecords: number;
  cleanRecords: number;
  removedDuplicates: number;
  removedEmptyRecords: number;
  readinessScore: number;
  language: "unknown";
  quality: DatasetQualitySummary;
}

export interface PreparedDataset {
  id: string;
  projectId: string;
  datasetId: string;
  analysisJobId: string;
  createdAt: string;
  records: DatasetRecord[];
  summary: PreparationSummary;
}

export type SentimentLabel = "positive" | "negative" | "neutral";

export interface SentimentRecordResult {
  id: string;
  recordId: string;
  text: string;
  sentiment: SentimentLabel;
  confidence: number;
  positiveKeywordMatches: string[];
  negativeKeywordMatches: string[];
}

export interface SentimentSummary {
  totalAnalysed: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
}

export interface AnalysisResult {
  id: string;
  projectId: string;
  datasetId: string;
  preparedDatasetId: string;
  analysisJobId: string;
  createdAt: string;
  engine: "rule_based_baseline" | "fastapi_sentiment" | "azure_sentiment";
  modelMetadata: ModelResultMetadata;
  summary: SentimentSummary;
  records: SentimentRecordResult[];
}

export type EmotionLabel = "joy" | "anger" | "sadness" | "fear" | "trust" | "surprise" | "neutral";
export type StanceLabel = "supportive" | "opposing" | "questioning" | "neutral";

export interface AspectResult {
  aspect: string;
  count: number;
  sampleRecordIds: string[];
}

export interface RiskSignal {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  count: number;
  matchedKeywords: string[];
  sampleRecordIds: string[];
}

export interface DeepAnalysisRecordResult {
  id: string;
  recordId: string;
  text: string;
  emotion: EmotionLabel;
  stance: StanceLabel;
  aspects: string[];
  riskSignals: string[];
}

export interface MultiDimensionalAnalysisResult {
  id: string;
  projectId: string;
  datasetId: string;
  analysisResultId: string;
  preparedDatasetId: string;
  createdAt: string;
  engine: "rule_based_deep_baseline" | "fastapi_deep_analysis" | "azure_deep_analysis";
  modelMetadata: ModelResultMetadata;
  emotionDistribution: Record<EmotionLabel, number>;
  stanceDistribution: Record<StanceLabel, number>;
  aspects: AspectResult[];
  riskSignals: RiskSignal[];
  records: DeepAnalysisRecordResult[];
}
