import type { ActionRoadmap, Recommendation, RoadmapStep } from "@/types/recommendation";

export function buildActionRoadmap(projectId: string, recommendations: Recommendation[]): ActionRoadmap {
  const highPriority = recommendations.filter((item) => item.priority === "high");
  const mediumPriority = recommendations.filter((item) => item.priority === "medium");
  const allRecommendationIds = recommendations.map((item) => item.id);

  return {
    id: crypto.randomUUID(),
    projectId,
    generatedAt: new Date().toISOString(),
    sevenDay: [
      createStep({
        description: "Review all high-priority evidence records, assign owners, and define immediate response language.",
        linkedRecommendationIds: highPriority.map((item) => item.id),
        timeframe: "7-day",
        title: "Triage priority issues"
      }),
      createStep({
        description: "Prepare support or communication actions for the strongest negative and risk signals.",
        linkedRecommendationIds: recommendations
          .filter((item) => ["customer-support", "crisis-risk"].includes(item.category))
          .map((item) => item.id),
        timeframe: "7-day",
        title: "Launch short-term response plan"
      })
    ],
    thirtyDay: [
      createStep({
        description: "Investigate repeated aspects and convert validated issues into product, content, or process improvements.",
        linkedRecommendationIds: mediumPriority.map((item) => item.id),
        timeframe: "30-day",
        title: "Resolve recurring themes"
      })
    ],
    longTerm: [
      createStep({
        description: "Track future datasets against this baseline and evaluate whether sentiment, stance, and risk signals improve.",
        linkedRecommendationIds: allRecommendationIds,
        timeframe: "long-term",
        title: "Monitor and improve opinion health"
      })
    ]
  };
}

function createStep(input: Omit<RoadmapStep, "id">): RoadmapStep {
  return {
    id: crypto.randomUUID(),
    ...input
  };
}
