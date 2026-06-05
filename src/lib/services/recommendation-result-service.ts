import type { AnalysisResult, MultiDimensionalAnalysisResult } from "@/types/analysis";
import type { RecommendationResult } from "@/types/recommendation";
import { buildActionRoadmap } from "@/lib/services/action-roadmap-service";
import {
  buildExecutiveActionSummary,
  generateRecommendations
} from "@/lib/services/recommendation-engine-service";

export function generateRecommendationResult(
  analysisResult: AnalysisResult,
  deepAnalysisResult: MultiDimensionalAnalysisResult
): RecommendationResult {
  const recommendations = generateRecommendations(analysisResult, deepAnalysisResult);

  return {
    id: crypto.randomUUID(),
    projectId: analysisResult.projectId,
    analysisResultId: analysisResult.id,
    multiDimensionalAnalysisResultId: deepAnalysisResult.id,
    createdAt: new Date().toISOString(),
    executiveActionSummary: buildExecutiveActionSummary(recommendations),
    recommendations,
    roadmap: buildActionRoadmap(analysisResult.projectId, recommendations)
  };
}
