import type { AnalysisResult, MultiDimensionalAnalysisResult, PreparedDataset } from "@/types/analysis";
import type { Dataset } from "@/types/dataset";
import type { OpinionProject } from "@/types/project";
import type { ReportSnapshot } from "@/types/report";
import type { RecommendationResult } from "@/types/recommendation";
import {
  getAverageConfidence,
  getDominantSentiment,
  getHealthLabel,
  getRiskLevel,
  getTopSentimentRecords
} from "@/lib/services/sentiment-insight-service";

export function generateReportSnapshot({
  analysisResult,
  dataset,
  deepAnalysisResult,
  preparedDataset,
  project,
  recommendationResult
}: {
  analysisResult: AnalysisResult;
  dataset: Dataset;
  deepAnalysisResult?: MultiDimensionalAnalysisResult | null;
  preparedDataset: PreparedDataset;
  project: OpinionProject;
  recommendationResult?: RecommendationResult | null;
}): ReportSnapshot {
  const dominantSentiment = getDominantSentiment(analysisResult);
  const riskLevel = getRiskLevel(analysisResult.summary.negativePercentage);
  const averageConfidence = getAverageConfidence(analysisResult);
  const topPositiveRecords = getTopSentimentRecords(analysisResult.records, "positive");
  const topNegativeRecords = getTopSentimentRecords(analysisResult.records, "negative");
  const health = getHealthLabel(
    analysisResult.summary.positivePercentage,
    analysisResult.summary.negativePercentage
  );
  const sentimentModelMetadata = analysisResult.modelMetadata ?? {
    provider: "rule-based" as const,
    modelName: "Rule-Based Baseline",
    modelVersion: "1.0.0",
    confidence: 0,
    processingTimeMs: 0
  };

  return {
    id: crypto.randomUUID(),
    projectId: project.id,
    datasetId: dataset.id,
    analysisResultId: analysisResult.id,
    preparedDatasetId: preparedDataset.id,
    createdAt: new Date().toISOString(),
    title: `${project.name} Opinion Intelligence Report`,
    sections: [
      "title",
      "executive_summary",
      "key_metrics",
      "findings",
      "evidence_records",
      "recommendations_placeholder"
    ],
    projectDetails: {
      analysisType: project.analysisType,
      goal: project.goal,
      projectName: project.name,
      status: "Report Ready"
    },
    datasetDetails: {
      cleanRecords: preparedDataset.summary.cleanRecords,
      createdAt: dataset.createdAt,
      originalRecords: preparedDataset.summary.originalRecords,
      sourceType: dataset.sourceType
    },
    sourceSummary: buildSourceSummary(dataset),
    preparationSummary: {
      readinessScore: preparedDataset.summary.readinessScore,
      removedDuplicates: preparedDataset.summary.removedDuplicates,
      removedEmptyRecords: preparedDataset.summary.removedEmptyRecords
    },
    sentimentSummary: {
      averageConfidence,
      dominantSentiment,
      negativeCount: analysisResult.summary.negativeCount,
      negativePercentage: analysisResult.summary.negativePercentage,
      neutralCount: analysisResult.summary.neutralCount,
      neutralPercentage: analysisResult.summary.neutralPercentage,
      positiveCount: analysisResult.summary.positiveCount,
      positivePercentage: analysisResult.summary.positivePercentage,
      riskLevel,
      totalAnalysed: analysisResult.summary.totalAnalysed
    },
    modelMetadata: {
      sentiment: sentimentModelMetadata,
      deepAnalysis: deepAnalysisResult?.modelMetadata
    },
    executiveSummary: buildExecutiveSummary({
      analysisResult,
      averageConfidence,
      dominantSentiment,
      health,
      project,
      riskLevel,
      sentimentModelMetadata
    }),
    insights: [
      {
        label: "Sentiment health",
        value: health,
        description: `${analysisResult.summary.positivePercentage}% positive and ${analysisResult.summary.negativePercentage}% negative sentiment.`
      },
      {
        label: "Risk level",
        value: riskLevel,
        description: `Risk is ${riskLevel.toLowerCase()} based on ${analysisResult.summary.negativePercentage}% negative records.`
      },
      {
        label: "Dominant sentiment",
        value: capitalize(dominantSentiment),
        description: "Dominant sentiment is determined from the largest sentiment segment."
      },
      {
        label: "Average confidence",
        value: `${averageConfidence}%`,
        description: `Average confidence from ${sentimentModelMetadata.modelName}.`
      }
    ],
    topPositiveRecords,
    topNegativeRecords,
    deepAnalysisSummary: deepAnalysisResult
      ? {
          emotionDistribution: deepAnalysisResult.emotionDistribution,
          stanceDistribution: deepAnalysisResult.stanceDistribution,
          topAspects: deepAnalysisResult.aspects,
          riskSignals: deepAnalysisResult.riskSignals
        }
      : undefined,
    recommendationSummary: recommendationResult
      ? {
          executiveActionSummary: recommendationResult.executiveActionSummary,
          recommendations: recommendationResult.recommendations,
          roadmap: recommendationResult.roadmap
        }
      : undefined,
    recommendationsPlaceholder:
      recommendationResult
        ? "Recommendations in this snapshot are rule-based and evidence-driven."
        : "Recommendations will appear after recommendation logic is run. No recommendation has been inferred in this snapshot."
  };
}

function buildExecutiveSummary({
  analysisResult,
  averageConfidence,
  dominantSentiment,
  health,
  project,
  riskLevel,
  sentimentModelMetadata
}: {
  analysisResult: AnalysisResult;
  averageConfidence: number;
  dominantSentiment: string;
  health: string;
  project: OpinionProject;
  riskLevel: string;
  sentimentModelMetadata: NonNullable<AnalysisResult["modelMetadata"]>;
}) {
  return `${project.name} was analysed for ${project.goal.toLowerCase()} using ${analysisResult.summary.totalAnalysed} prepared records. The dominant sentiment is ${dominantSentiment}, with ${analysisResult.summary.positivePercentage}% positive, ${analysisResult.summary.negativePercentage}% negative, and ${analysisResult.summary.neutralPercentage}% neutral records. Overall sentiment health is ${health.toLowerCase()}, risk level is ${riskLevel.toLowerCase()}, and the average model confidence is ${averageConfidence}%. Provider: ${sentimentModelMetadata.provider}, model: ${sentimentModelMetadata.modelName}.`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildSourceSummary(dataset: Dataset): ReportSnapshot["sourceSummary"] {
  const sourceMap = new Map<string, { recordCount: number; title: string; url: string }>();
  const limitations = new Set<string>();

  dataset.records.forEach((record) => {
    const sourceUrl = record.metadata?.sourceUrl;
    const sourceTitle = record.metadata?.sourceTitle;
    const recordLimitations = record.metadata?.limitations;

    if (sourceUrl) {
      const current = sourceMap.get(sourceUrl) ?? {
        recordCount: 0,
        title: sourceTitle || sourceUrl,
        url: sourceUrl
      };
      current.recordCount += 1;
      sourceMap.set(sourceUrl, current);
    }

    recordLimitations?.split(" | ").forEach((limitation) => {
      if (limitation.trim()) {
        limitations.add(limitation.trim());
      }
    });
  });

  const sources = Array.from(sourceMap.values());
  if (sources.length === 0 && limitations.size === 0) {
    return undefined;
  }

  return {
    limitations: Array.from(limitations),
    note: "Analysis is based only on publicly accessible extracted text and user-provided records. No hidden, private, login-protected, or CAPTCHA-protected data was analysed.",
    sources
  };
}
