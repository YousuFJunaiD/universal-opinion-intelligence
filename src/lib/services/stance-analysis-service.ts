import type { StanceLabel } from "@/types/analysis";

const STANCE_KEYWORDS: Record<Exclude<StanceLabel, "neutral">, string[]> = {
  supportive: ["support", "agree", "recommend", "love", "yes", "helpful", "satisfied", "best"],
  opposing: ["oppose", "disagree", "hate", "boycott", "against", "never", "worst", "scam"],
  questioning: ["why", "how", "what", "when", "?", "confused", "question", "clarify"]
};

export function detectStance(text: string): StanceLabel {
  const scores = Object.entries(STANCE_KEYWORDS).map(([stance, keywords]) => ({
    score: countMatches(text, keywords),
    stance: stance as StanceLabel
  }));
  const best = scores.sort((a, b) => b.score - a.score)[0];
  return best && best.score > 0 ? best.stance : "neutral";
}

function countMatches(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    if (keyword === "?") {
      return count + (normalized.includes("?") ? 1 : 0);
    }

    const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
    return count + (pattern.test(normalized) ? 1 : 0);
  }, 0);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
