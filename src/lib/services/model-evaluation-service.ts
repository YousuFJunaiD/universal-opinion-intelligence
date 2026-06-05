import type {
  AnalysisJob,
  PreparedDataset,
  SentimentLabel,
  SentimentRecordResult
} from "@/types/analysis";
import type { DatasetRecord } from "@/types/dataset";
import type {
  BenchmarkDataset,
  ClassEvaluationMetrics,
  ConfusionMatrix,
  EvaluationPrediction,
  ModelEvaluationResult
} from "@/types/evaluation";
import { getAnalysisProvider } from "@/lib/ml/analysis-provider";
import { runSentimentAnalysis } from "@/lib/services/sentiment-analysis-service";

const SENTIMENT_LABELS: SentimentLabel[] = ["positive", "negative", "neutral"];

export async function runBenchmarkEvaluation(dataset: BenchmarkDataset): Promise<ModelEvaluationResult> {
  const preparedDataset = createPreparedDataset(dataset);
  const analysisJob = createAnalysisJob(preparedDataset);
  const analysisResult = await runSentimentAnalysis(preparedDataset, analysisJob);
  const predictions = buildPredictions(dataset, analysisResult.records);
  const confusionMatrix = buildConfusionMatrix(predictions);
  const perClassMetrics = buildPerClassMetrics(confusionMatrix);
  const correctCount = predictions.filter((prediction) => prediction.correct).length;

  return {
    id: crypto.randomUUID(),
    benchmarkDatasetId: dataset.id,
    benchmarkDatasetName: dataset.name,
    evaluatedAt: new Date().toISOString(),
    provider: getAnalysisProvider(),
    modelName: analysisResult.modelMetadata.modelName,
    modelVersion: analysisResult.modelMetadata.modelVersion,
    totalRecords: predictions.length,
    accuracy: roundMetric(correctCount / Math.max(predictions.length, 1)),
    precision: roundMetric(mean(perClassMetrics.map((metric) => metric.precision))),
    recall: roundMetric(mean(perClassMetrics.map((metric) => metric.recall))),
    f1: roundMetric(mean(perClassMetrics.map((metric) => metric.f1))),
    confusionMatrix,
    perClassMetrics,
    predictions,
    wrongPredictions: predictions.filter((prediction) => !prediction.correct)
  };
}

export function calculateEvaluationMetrics(
  dataset: BenchmarkDataset,
  sentimentRecords: SentimentRecordResult[],
  metadata: { modelName: string; modelVersion: string; provider?: ModelEvaluationResult["provider"] }
): ModelEvaluationResult {
  const predictions = buildPredictions(dataset, sentimentRecords);
  const confusionMatrix = buildConfusionMatrix(predictions);
  const perClassMetrics = buildPerClassMetrics(confusionMatrix);
  const correctCount = predictions.filter((prediction) => prediction.correct).length;

  return {
    id: crypto.randomUUID(),
    benchmarkDatasetId: dataset.id,
    benchmarkDatasetName: dataset.name,
    evaluatedAt: new Date().toISOString(),
    provider: metadata.provider ?? getAnalysisProvider(),
    modelName: metadata.modelName,
    modelVersion: metadata.modelVersion,
    totalRecords: predictions.length,
    accuracy: roundMetric(correctCount / Math.max(predictions.length, 1)),
    precision: roundMetric(mean(perClassMetrics.map((metric) => metric.precision))),
    recall: roundMetric(mean(perClassMetrics.map((metric) => metric.recall))),
    f1: roundMetric(mean(perClassMetrics.map((metric) => metric.f1))),
    confusionMatrix,
    perClassMetrics,
    predictions,
    wrongPredictions: predictions.filter((prediction) => !prediction.correct)
  };
}

function createPreparedDataset(dataset: BenchmarkDataset): PreparedDataset {
  const now = new Date().toISOString();
  const records: DatasetRecord[] = dataset.records.map((record, index) => ({
    id: record.id,
    text: record.text,
    sourceType: dataset.sourceType === "csv" ? "csv_upload" : "paste_text",
    createdAt: now,
    rowIndex: index,
    metadata: { expectedSentiment: record.expectedSentiment }
  }));

  return {
    id: `benchmark-prepared-${dataset.id}`,
    projectId: "benchmark-evaluation",
    datasetId: dataset.id,
    analysisJobId: `benchmark-job-${dataset.id}`,
    createdAt: now,
    records,
    summary: {
      originalRecords: records.length,
      cleanRecords: records.length,
      removedDuplicates: 0,
      removedEmptyRecords: 0,
      readinessScore: 100,
      language: "unknown",
      quality: {
        totalRecords: records.length,
        duplicateCount: 0,
        emptyRemovedCount: 0,
        averageTextLength: records.length
          ? Math.round(records.reduce((total, record) => total + record.text.length, 0) / records.length)
          : 0,
        shortestTextLength: records.length ? Math.min(...records.map((record) => record.text.length)) : 0,
        longestTextLength: records.length ? Math.max(...records.map((record) => record.text.length)) : 0
      }
    }
  };
}

function createAnalysisJob(preparedDataset: PreparedDataset): AnalysisJob {
  const now = new Date().toISOString();
  return {
    id: preparedDataset.analysisJobId,
    projectId: preparedDataset.projectId,
    datasetId: preparedDataset.datasetId,
    preparedDatasetId: preparedDataset.id,
    status: "processing",
    createdAt: now,
    updatedAt: now
  };
}

function buildPredictions(
  dataset: BenchmarkDataset,
  sentimentRecords: SentimentRecordResult[]
): EvaluationPrediction[] {
  const recordsById = new Map(sentimentRecords.map((record) => [record.recordId, record]));

  return dataset.records.map((record) => {
    const prediction = recordsById.get(record.id);
    const predictedSentiment = prediction?.sentiment ?? "neutral";

    return {
      recordId: record.id,
      text: record.text,
      expectedSentiment: record.expectedSentiment,
      predictedSentiment,
      confidence: prediction?.confidence ?? 0,
      correct: record.expectedSentiment === predictedSentiment
    };
  });
}

function buildConfusionMatrix(predictions: EvaluationPrediction[]): ConfusionMatrix {
  const matrix = createEmptyConfusionMatrix();

  predictions.forEach((prediction) => {
    matrix[prediction.expectedSentiment][prediction.predictedSentiment] += 1;
  });

  return matrix;
}

function buildPerClassMetrics(matrix: ConfusionMatrix): ClassEvaluationMetrics[] {
  return SENTIMENT_LABELS.map((label) => {
    const truePositive = matrix[label][label];
    const falsePositive = SENTIMENT_LABELS
      .filter((actualLabel) => actualLabel !== label)
      .reduce((total, actualLabel) => total + matrix[actualLabel][label], 0);
    const falseNegative = SENTIMENT_LABELS
      .filter((predictedLabel) => predictedLabel !== label)
      .reduce((total, predictedLabel) => total + matrix[label][predictedLabel], 0);
    const precision = safeDivide(truePositive, truePositive + falsePositive);
    const recall = safeDivide(truePositive, truePositive + falseNegative);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    return {
      label,
      precision: roundMetric(precision),
      recall: roundMetric(recall),
      f1: roundMetric(f1),
      support: SENTIMENT_LABELS.reduce((total, predictedLabel) => total + matrix[label][predictedLabel], 0)
    };
  });
}

function createEmptyConfusionMatrix(): ConfusionMatrix {
  return {
    positive: { positive: 0, negative: 0, neutral: 0 },
    negative: { positive: 0, negative: 0, neutral: 0 },
    neutral: { positive: 0, negative: 0, neutral: 0 }
  };
}

function safeDivide(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function mean(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function roundMetric(value: number) {
  return Number(value.toFixed(4));
}
