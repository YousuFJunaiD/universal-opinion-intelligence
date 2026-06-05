import type { AnalysisResult, SentimentLabel, SentimentRecordResult } from "@/types/analysis";

export type RiskLevel = "Low" | "Medium" | "High";
export type SentimentHealth = "Healthy" | "Mixed" | "Needs Attention";

export function getRiskLevel(negativePercentage: number): RiskLevel {
  if (negativePercentage >= 50) {
    return "High";
  }

  if (negativePercentage >= 25) {
    return "Medium";
  }

  return "Low";
}

export function getDominantSentiment(result: AnalysisResult): SentimentLabel {
  const entries: Array<{ label: SentimentLabel; value: number }> = [
    { label: "positive", value: result.summary.positiveCount },
    { label: "negative", value: result.summary.negativeCount },
    { label: "neutral", value: result.summary.neutralCount }
  ];

  return entries.sort((a, b) => b.value - a.value)[0]?.label ?? "neutral";
}

export function getAverageConfidence(result: AnalysisResult) {
  if (result.records.length === 0) {
    return 0;
  }

  const total = result.records.reduce((sum, record) => sum + record.confidence, 0);
  return Math.round((total / result.records.length) * 100);
}

export function getTopSentimentRecords(
  records: SentimentRecordResult[],
  sentiment: SentimentLabel,
  limit = 5
) {
  return records
    .filter((record) => record.sentiment === sentiment)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

export function getHealthLabel(positivePercentage: number, negativePercentage: number): SentimentHealth {
  if (negativePercentage >= 50) {
    return "Needs Attention";
  }

  if (positivePercentage >= 50) {
    return "Healthy";
  }

  return "Mixed";
}

export function getHealthDescription(positivePercentage: number, negativePercentage: number) {
  if (negativePercentage >= 50) {
    return "Negative sentiment is the strongest signal in this dataset.";
  }

  if (positivePercentage >= 50) {
    return "Positive sentiment leads the analysed records.";
  }

  return `Signals are balanced, with ${positivePercentage}% positive and ${negativePercentage}% negative.`;
}
