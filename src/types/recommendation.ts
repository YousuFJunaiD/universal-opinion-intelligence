export type RecommendationPriority = "high" | "medium" | "low";

export type RecommendationCategory =
  | "reputation"
  | "product"
  | "content"
  | "customer-support"
  | "crisis-risk"
  | "trust-building"
  | "engagement";

export interface Recommendation {
  id: string;
  title: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  rationale: string;
  evidence: string[];
  suggestedAction: string;
}

export interface RoadmapStep {
  id: string;
  timeframe: "7-day" | "30-day" | "long-term";
  title: string;
  description: string;
  linkedRecommendationIds: string[];
}

export interface ActionRoadmap {
  id: string;
  projectId: string;
  generatedAt: string;
  sevenDay: RoadmapStep[];
  thirtyDay: RoadmapStep[];
  longTerm: RoadmapStep[];
}

export interface RecommendationResult {
  id: string;
  projectId: string;
  analysisResultId: string;
  multiDimensionalAnalysisResultId: string;
  createdAt: string;
  executiveActionSummary: string;
  recommendations: Recommendation[];
  roadmap: ActionRoadmap;
}
