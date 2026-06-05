import type { AnalysisResult, PreparedDataset, RiskSignal } from "@/types/analysis";

const RISK_KEYWORDS = ["scam", "hate", "complaint", "broken", "issue", "boycott", "unsafe", "angry", "problem", "worst"];

export function detectRiskSignals(preparedDataset: PreparedDataset, analysisResult: AnalysisResult): RiskSignal[] {
  const keywordMatches = new Map<string, { count: number; sampleRecordIds: string[] }>();

  preparedDataset.records.forEach((record) => {
    RISK_KEYWORDS.forEach((keyword) => {
      if (hasKeyword(record.text, keyword)) {
        const current = keywordMatches.get(keyword) ?? { count: 0, sampleRecordIds: [] };
        current.count += 1;
        if (current.sampleRecordIds.length < 3) {
          current.sampleRecordIds.push(record.id);
        }
        keywordMatches.set(keyword, current);
      }
    });
  });

  const signals: RiskSignal[] = Array.from(keywordMatches.entries()).map(([keyword, value]) => ({
    id: crypto.randomUUID(),
    label: `${capitalize(keyword)} signal`,
    severity: getKeywordSeverity(keyword, value.count),
    count: value.count,
    matchedKeywords: [keyword],
    sampleRecordIds: value.sampleRecordIds
  }));

  if (analysisResult.summary.negativePercentage >= 50) {
    signals.unshift({
      id: crypto.randomUUID(),
      label: "High negative sentiment concentration",
      severity: "high",
      count: analysisResult.summary.negativeCount,
      matchedKeywords: ["negative sentiment"],
      sampleRecordIds: analysisResult.records
        .filter((record) => record.sentiment === "negative")
        .slice(0, 3)
        .map((record) => record.recordId)
    });
  }

  return signals.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.count - a.count).slice(0, 10);
}

export function detectRecordRiskSignals(text: string, signals: RiskSignal[]) {
  return signals
    .filter((signal) => signal.matchedKeywords.some((keyword) => keyword !== "negative sentiment" && hasKeyword(text, keyword)))
    .map((signal) => signal.label);
}

function hasKeyword(text: string, keyword: string) {
  const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
  return pattern.test(text.toLowerCase());
}

function getKeywordSeverity(keyword: string, count: number): RiskSignal["severity"] {
  if (["scam", "unsafe", "boycott", "hate"].includes(keyword) || count >= 3) {
    return "high";
  }

  if (["complaint", "broken", "angry", "worst"].includes(keyword) || count >= 2) {
    return "medium";
  }

  return "low";
}

function severityRank(severity: RiskSignal["severity"]) {
  return severity === "high" ? 3 : severity === "medium" ? 2 : 1;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
