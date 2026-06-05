import type { AnalysisResult, MultiDimensionalAnalysisResult } from "@/types/analysis";
import type { Recommendation } from "@/types/recommendation";

export function generateRecommendations(
  analysisResult: AnalysisResult,
  deepAnalysisResult: MultiDimensionalAnalysisResult
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const negativePercentage = analysisResult.summary.negativePercentage;
  const angerCount = deepAnalysisResult.emotionDistribution.anger;
  const sadnessCount = deepAnalysisResult.emotionDistribution.sadness;
  const joyCount = deepAnalysisResult.emotionDistribution.joy;
  const trustCount = deepAnalysisResult.emotionDistribution.trust;
  const opposingCount = deepAnalysisResult.stanceDistribution.opposing;
  const total = Math.max(analysisResult.summary.totalAnalysed, 1);

  if (negativePercentage >= 25) {
    recommendations.push(
      createRecommendation({
        category: negativePercentage >= 50 ? "crisis-risk" : "customer-support",
        evidence: [
          `${negativePercentage}% negative sentiment`,
          `${analysisResult.summary.negativeCount} negative records`
        ],
        priority: negativePercentage >= 50 ? "high" : "medium",
        rationale: "Negative sentiment crossed the deterministic risk threshold.",
        suggestedAction:
          "Create a response queue for the highest-confidence negative records and assign owners for public or direct follow-up.",
        title: negativePercentage >= 50 ? "Activate crisis response triage" : "Prioritize customer support follow-up"
      })
    );
  }

  if (angerCount / total >= 0.2) {
    recommendations.push(
      createRecommendation({
        category: "customer-support",
        evidence: [`${angerCount} anger-labelled records`, "Anger emotion threshold >= 20%"],
        priority: "high",
        rationale: "Anger signals require de-escalation before wider reputation damage.",
        suggestedAction:
          "Use empathetic response templates, acknowledge the issue clearly, and route angry records to senior support review.",
        title: "De-escalate anger-heavy feedback"
      })
    );
  }

  if (sadnessCount / total >= 0.2) {
    recommendations.push(
      createRecommendation({
        category: "trust-building",
        evidence: [`${sadnessCount} sadness-labelled records`, "Sadness or disappointment threshold >= 20%"],
        priority: "medium",
        rationale: "Sadness and disappointment suggest trust repair work is needed.",
        suggestedAction:
          "Publish clear expectation-setting updates and follow up with users whose records show disappointment.",
        title: "Repair trust after disappointment signals"
      })
    );
  }

  deepAnalysisResult.aspects.slice(0, 3).forEach((aspect) => {
    recommendations.push(
      createRecommendation({
        category: "product",
        evidence: [`Aspect "${aspect.aspect}" appeared in ${aspect.count} records`],
        priority: aspect.count >= 3 ? "medium" : "low",
        rationale: "Repeated aspects indicate concrete improvement or messaging themes.",
        suggestedAction: `Review records mentioning "${aspect.aspect}" and decide whether product, service, or content changes are required.`,
        title: `Investigate repeated aspect: ${aspect.aspect}`
      })
    );
  });

  if (opposingCount / total >= 0.2) {
    recommendations.push(
      createRecommendation({
        category: "content",
        evidence: [`${opposingCount} opposing stance records`, "Opposing stance threshold >= 20%"],
        priority: "medium",
        rationale: "Opposing stance suggests messaging may be unclear or contested.",
        suggestedAction:
          "Clarify the core message, address common objections, and test revised communication on future datasets.",
        title: "Clarify messaging for opposing audience segments"
      })
    );
  }

  if ((joyCount + trustCount) / total >= 0.35) {
    recommendations.push(
      createRecommendation({
        category: "engagement",
        evidence: [`${joyCount} joy records`, `${trustCount} trust records`],
        priority: "low",
        rationale: "Positive trust and joy signals can be amplified without inventing claims.",
        suggestedAction:
          "Identify positive records with high confidence and reuse their themes in testimonials, FAQs, or engagement content.",
        title: "Amplify positive trust and joy themes"
      })
    );
  }

  if (deepAnalysisResult.riskSignals.some((signal) => signal.severity === "high")) {
    recommendations.push(
      createRecommendation({
        category: "crisis-risk",
        evidence: deepAnalysisResult.riskSignals
          .filter((signal) => signal.severity === "high")
          .slice(0, 3)
          .map((signal) => `${signal.label}: ${signal.count} records`),
        priority: "high",
        rationale: "High-severity risk signals were detected by deterministic keyword rules.",
        suggestedAction:
          "Audit high-risk records immediately, document root causes, and prepare a concise response plan.",
        title: "Review high-severity risk signals"
      })
    );
  }

  return deduplicateRecommendations(recommendations).slice(0, 8);
}

export function buildExecutiveActionSummary(recommendations: Recommendation[]) {
  const highPriority = recommendations.filter((item) => item.priority === "high").length;
  const mediumPriority = recommendations.filter((item) => item.priority === "medium").length;
  const topCategories = Array.from(new Set(recommendations.map((item) => item.category))).slice(0, 3);

  if (recommendations.length === 0) {
    return "No deterministic recommendation thresholds were triggered. Continue monitoring future datasets and preserve the current response posture.";
  }

  return `${recommendations.length} evidence-based recommendations were generated: ${highPriority} high priority and ${mediumPriority} medium priority. Primary action areas are ${topCategories.join(", ")}.`;
}

function createRecommendation(input: Omit<Recommendation, "id">): Recommendation {
  return {
    id: crypto.randomUUID(),
    ...input
  };
}

function deduplicateRecommendations(recommendations: Recommendation[]) {
  const seen = new Set<string>();
  return recommendations.filter((recommendation) => {
    if (seen.has(recommendation.title)) {
      return false;
    }

    seen.add(recommendation.title);
    return true;
  });
}
