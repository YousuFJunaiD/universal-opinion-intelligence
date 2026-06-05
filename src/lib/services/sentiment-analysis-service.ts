import type {
  AnalysisJob,
  AnalysisProvider,
  AnalysisResult,
  PreparedDataset,
  SentimentLabel,
  SentimentRecordResult
} from "@/types/analysis";
import { getAnalysisProvider } from "@/lib/ml/analysis-provider";
import { buildFallbackMetadata, runFastApiSentiment } from "@/lib/ml/ml-client";

const POSITIVE_KEYWORDS = [
  "good",
  "great",
  "amazing",
  "excellent",
  "love",
  "useful",
  "happy",
  "satisfied",
  "recommend",
  "best",
  "helpful"
];

const NEGATIVE_KEYWORDS = [
  "bad",
  "worst",
  "poor",
  "hate",
  "disappointed",
  "useless",
  "angry",
  "problem",
  "issue",
  "slow",
  "scam",
  "broken"
];

export function runRuleBasedSentimentAnalysis(
  preparedDataset: PreparedDataset,
  analysisJob: AnalysisJob,
  fallback?: { fallbackFrom?: AnalysisProvider; fallbackReason?: string; processingTimeMs?: number }
): AnalysisResult {
  const startedAt = Date.now();
  const records = preparedDataset.records.map((record) => {
    const positiveKeywordMatches = findKeywordMatches(record.text, POSITIVE_KEYWORDS);
    const negativeKeywordMatches = findKeywordMatches(record.text, NEGATIVE_KEYWORDS);
    const sentiment = classifySentiment(positiveKeywordMatches.length, negativeKeywordMatches.length);

    return {
      id: crypto.randomUUID(),
      recordId: record.id,
      text: record.text,
      sentiment,
      confidence: calculateConfidence({
        negativeMatches: negativeKeywordMatches.length,
        positiveMatches: positiveKeywordMatches.length,
        sentiment
      }),
      positiveKeywordMatches,
      negativeKeywordMatches
    };
  });

  const processingTimeMs = fallback?.processingTimeMs ?? Date.now() - startedAt;
  const averageConfidence = calculateAverageConfidence(records);

  return {
    id: crypto.randomUUID(),
    projectId: preparedDataset.projectId,
    datasetId: preparedDataset.datasetId,
    preparedDatasetId: preparedDataset.id,
    analysisJobId: analysisJob.id,
    createdAt: new Date().toISOString(),
    engine: "rule_based_baseline",
    modelMetadata: {
      ...buildFallbackMetadata({
        fallbackFrom: fallback?.fallbackFrom,
        fallbackReason: fallback?.fallbackReason,
        processingTimeMs
      }),
      confidence: averageConfidence
    },
    summary: buildSentimentSummary(records),
    records
  };
}

export async function runSentimentAnalysis(
  preparedDataset: PreparedDataset,
  analysisJob: AnalysisJob
): Promise<AnalysisResult> {
  const provider = getAnalysisProvider();

  if (provider === "rule-based") {
    return runRuleBasedSentimentAnalysis(preparedDataset, analysisJob);
  }

  if (provider === "fastapi") {
    const startedAt = Date.now();
    try {
      return await runFastApiSentiment(preparedDataset, analysisJob);
    } catch (error) {
      return runRuleBasedSentimentAnalysis(preparedDataset, analysisJob, {
        fallbackFrom: "fastapi",
        fallbackReason: error instanceof Error ? error.message : "FastAPI ML service failed.",
        processingTimeMs: Date.now() - startedAt
      });
    }
  }

  return runRuleBasedSentimentAnalysis(preparedDataset, analysisJob, {
    fallbackFrom: "azure",
    fallbackReason: "Azure provider adapter is not connected yet."
  });
}

function findKeywordMatches(text: string, keywords: string[]) {
  const normalizedText = text.toLowerCase();

  return keywords.filter((keyword) => {
    const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
    return pattern.test(normalizedText);
  });
}

function classifySentiment(positiveMatches: number, negativeMatches: number): SentimentLabel {
  if (positiveMatches > negativeMatches) {
    return "positive";
  }

  if (negativeMatches > positiveMatches) {
    return "negative";
  }

  return "neutral";
}

function calculateConfidence({
  negativeMatches,
  positiveMatches,
  sentiment
}: {
  negativeMatches: number;
  positiveMatches: number;
  sentiment: SentimentLabel;
}) {
  const totalMatches = positiveMatches + negativeMatches;

  if (sentiment === "neutral") {
    return totalMatches === 0 ? 0.52 : 0.6;
  }

  const margin = Math.abs(positiveMatches - negativeMatches);
  const confidence = 0.58 + margin * 0.14 + totalMatches * 0.04;
  return Math.min(0.95, Number(confidence.toFixed(2)));
}

function buildSentimentSummary(records: SentimentRecordResult[]) {
  const totalAnalysed = records.length;
  const positiveCount = records.filter((record) => record.sentiment === "positive").length;
  const negativeCount = records.filter((record) => record.sentiment === "negative").length;
  const neutralCount = records.filter((record) => record.sentiment === "neutral").length;

  return {
    totalAnalysed,
    positiveCount,
    negativeCount,
    neutralCount,
    positivePercentage: toPercentage(positiveCount, totalAnalysed),
    negativePercentage: toPercentage(negativeCount, totalAnalysed),
    neutralPercentage: toPercentage(neutralCount, totalAnalysed)
  };
}

function toPercentage(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function calculateAverageConfidence(records: SentimentRecordResult[]) {
  if (records.length === 0) {
    return 0;
  }
  const total = records.reduce((sum, record) => sum + record.confidence, 0);
  return Number((total / records.length).toFixed(2));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
