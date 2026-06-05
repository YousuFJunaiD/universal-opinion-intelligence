import type { AnalysisProvider, AnalysisResult, EmotionLabel, MultiDimensionalAnalysisResult, PreparedDataset, StanceLabel } from "@/types/analysis";
import { getAnalysisProvider } from "@/lib/ml/analysis-provider";
import { buildFallbackMetadata, runFastApiDeepAnalysis } from "@/lib/ml/ml-client";
import { detectRecordAspects, detectAspects } from "@/lib/services/aspect-detection-service";
import { detectEmotion } from "@/lib/services/emotion-analysis-service";
import { detectRecordRiskSignals, detectRiskSignals } from "@/lib/services/risk-signal-service";
import { detectStance } from "@/lib/services/stance-analysis-service";

export function runMultiDimensionalAnalysis(
  preparedDataset: PreparedDataset,
  analysisResult: AnalysisResult,
  fallback?: { fallbackFrom?: AnalysisProvider; fallbackReason?: string; processingTimeMs?: number }
): MultiDimensionalAnalysisResult {
  const startedAt = Date.now();
  const aspects = detectAspects(preparedDataset);
  const riskSignals = detectRiskSignals(preparedDataset, analysisResult);
  const records = preparedDataset.records.map((record) => ({
    id: crypto.randomUUID(),
    recordId: record.id,
    text: record.text,
    emotion: detectEmotion(record.text),
    stance: detectStance(record.text),
    aspects: detectRecordAspects(record.text, aspects),
    riskSignals: detectRecordRiskSignals(record.text, riskSignals)
  }));

  return {
    id: crypto.randomUUID(),
    projectId: preparedDataset.projectId,
    datasetId: preparedDataset.datasetId,
    analysisResultId: analysisResult.id,
    preparedDatasetId: preparedDataset.id,
    createdAt: new Date().toISOString(),
    engine: "rule_based_deep_baseline",
    modelMetadata: {
      ...buildFallbackMetadata({
        fallbackFrom: fallback?.fallbackFrom,
        fallbackReason: fallback?.fallbackReason,
        processingTimeMs: fallback?.processingTimeMs ?? Date.now() - startedAt
      }),
      confidence: analysisResult.modelMetadata?.confidence ?? 0
    },
    emotionDistribution: buildEmotionDistribution(records.map((record) => record.emotion)),
    stanceDistribution: buildStanceDistribution(records.map((record) => record.stance)),
    aspects,
    riskSignals,
    records
  };
}

export async function runDeepAnalysis(
  preparedDataset: PreparedDataset,
  analysisResult: AnalysisResult
): Promise<MultiDimensionalAnalysisResult> {
  const provider = getAnalysisProvider();

  if (provider === "rule-based") {
    return runMultiDimensionalAnalysis(preparedDataset, analysisResult);
  }

  if (provider === "fastapi") {
    const startedAt = Date.now();
    try {
      return await runFastApiDeepAnalysis(preparedDataset, analysisResult);
    } catch (error) {
      return runMultiDimensionalAnalysis(preparedDataset, analysisResult, {
        fallbackFrom: "fastapi",
        fallbackReason: error instanceof Error ? error.message : "FastAPI ML service failed.",
        processingTimeMs: Date.now() - startedAt
      });
    }
  }

  return runMultiDimensionalAnalysis(preparedDataset, analysisResult, {
    fallbackFrom: "azure",
    fallbackReason: "Azure provider adapter is not connected yet."
  });
}

function buildEmotionDistribution(labels: EmotionLabel[]): Record<EmotionLabel, number> {
  return {
    joy: countLabels(labels, "joy"),
    anger: countLabels(labels, "anger"),
    sadness: countLabels(labels, "sadness"),
    fear: countLabels(labels, "fear"),
    trust: countLabels(labels, "trust"),
    surprise: countLabels(labels, "surprise"),
    neutral: countLabels(labels, "neutral")
  };
}

function buildStanceDistribution(labels: StanceLabel[]): Record<StanceLabel, number> {
  return {
    supportive: countLabels(labels, "supportive"),
    opposing: countLabels(labels, "opposing"),
    questioning: countLabels(labels, "questioning"),
    neutral: countLabels(labels, "neutral")
  };
}

function countLabels<TLabel extends string>(labels: TLabel[], target: TLabel) {
  return labels.filter((label) => label === target).length;
}
