import type { AnalysisProvider, SentimentLabel } from "@/types/analysis";

export interface BenchmarkRecord {
  id: string;
  text: string;
  expectedSentiment: SentimentLabel;
}

export interface BenchmarkDataset {
  id: string;
  name: string;
  createdAt: string;
  sourceType: "paste" | "csv";
  records: BenchmarkRecord[];
}

export type ConfusionMatrix = Record<SentimentLabel, Record<SentimentLabel, number>>;

export interface ClassEvaluationMetrics {
  label: SentimentLabel;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface EvaluationPrediction {
  recordId: string;
  text: string;
  expectedSentiment: SentimentLabel;
  predictedSentiment: SentimentLabel;
  confidence: number;
  correct: boolean;
}

export interface ModelEvaluationResult {
  id: string;
  benchmarkDatasetId: string;
  benchmarkDatasetName: string;
  evaluatedAt: string;
  provider: AnalysisProvider;
  modelName: string;
  modelVersion: string;
  totalRecords: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: ConfusionMatrix;
  perClassMetrics: ClassEvaluationMetrics[];
  predictions: EvaluationPrediction[];
  wrongPredictions: EvaluationPrediction[];
}

export interface EvaluationRunRequest {
  dataset: BenchmarkDataset;
}

export interface EvaluationRunResponse {
  result: ModelEvaluationResult;
}
