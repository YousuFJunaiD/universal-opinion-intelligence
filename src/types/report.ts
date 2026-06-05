import type {
  AspectResult,
  EmotionLabel,
  ModelResultMetadata,
  RiskSignal,
  SentimentLabel,
  SentimentRecordResult,
  StanceLabel
} from "@/types/analysis";
import type { DataSourceType } from "@/types/dataset";
import type { AnalysisType, ProjectGoal } from "@/types/project";
import type { Recommendation, ActionRoadmap } from "@/types/recommendation";

export type ReportSection =
  | "title"
  | "executive_summary"
  | "key_metrics"
  | "findings"
  | "evidence_records"
  | "recommendations_placeholder";

export interface ReportInsight {
  label: string;
  value: string;
  description: string;
}

export interface ReportSnapshot {
  id: string;
  projectId: string;
  datasetId: string;
  analysisResultId: string;
  preparedDatasetId: string;
  createdAt: string;
  title: string;
  sections: ReportSection[];
  projectDetails: {
    analysisType: AnalysisType;
    goal: ProjectGoal;
    projectName: string;
    status: string;
  };
  datasetDetails: {
    cleanRecords: number;
    createdAt: string;
    originalRecords: number;
    sourceType: DataSourceType;
  };
  sourceSummary?: {
    limitations: string[];
    note: string;
    sources: Array<{
      recordCount: number;
      title: string;
      url: string;
    }>;
  };
  preparationSummary: {
    readinessScore: number;
    removedDuplicates: number;
    removedEmptyRecords: number;
  };
  sentimentSummary: {
    averageConfidence: number;
    dominantSentiment: SentimentLabel;
    negativeCount: number;
    negativePercentage: number;
    neutralCount: number;
    neutralPercentage: number;
    positiveCount: number;
    positivePercentage: number;
    riskLevel: "Low" | "Medium" | "High";
    totalAnalysed: number;
  };
  modelMetadata: {
    sentiment: ModelResultMetadata;
    deepAnalysis?: ModelResultMetadata;
  };
  executiveSummary: string;
  insights: ReportInsight[];
  topPositiveRecords: SentimentRecordResult[];
  topNegativeRecords: SentimentRecordResult[];
  deepAnalysisSummary?: {
    emotionDistribution: Record<EmotionLabel, number>;
    stanceDistribution: Record<StanceLabel, number>;
    topAspects: AspectResult[];
    riskSignals: RiskSignal[];
  };
  recommendationSummary?: {
    executiveActionSummary: string;
    recommendations: Recommendation[];
    roadmap: ActionRoadmap;
  };
  recommendationsPlaceholder: string;
}

export type ReportExportType = "pdf-print";

export interface ReportExport {
  exportId: string;
  reportSnapshotId: string;
  projectId: string;
  exportedAt: string;
  exportType: ReportExportType;
}
