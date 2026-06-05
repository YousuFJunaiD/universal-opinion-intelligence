import type { EmotionLabel } from "@/types/analysis";

const EMOTION_KEYWORDS: Record<Exclude<EmotionLabel, "neutral">, string[]> = {
  joy: ["happy", "love", "great", "amazing", "excellent", "best", "satisfied", "delight", "wonderful"],
  anger: ["angry", "hate", "worst", "scam", "complaint", "broken", "useless", "terrible"],
  sadness: ["sad", "disappointed", "unhappy", "regret", "poor", "upset"],
  fear: ["fear", "unsafe", "risk", "worried", "concern", "danger", "threat"],
  trust: ["trust", "reliable", "helpful", "recommend", "useful", "secure", "support"],
  surprise: ["surprise", "unexpected", "wow", "sudden", "shocked"]
};

export function detectEmotion(text: string): EmotionLabel {
  const scores = Object.entries(EMOTION_KEYWORDS).map(([emotion, keywords]) => ({
    emotion: emotion as EmotionLabel,
    score: countMatches(text, keywords)
  }));
  const best = scores.sort((a, b) => b.score - a.score)[0];
  return best && best.score > 0 ? best.emotion : "neutral";
}

function countMatches(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
    return count + (pattern.test(normalized) ? 1 : 0);
  }, 0);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
