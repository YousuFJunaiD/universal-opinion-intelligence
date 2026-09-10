import type { SentimentLabel } from "@/types/analysis";
import { showcaseUseCases } from "./showcase-config";

export type ReviewRiskLevel = "low" | "medium" | "high";

export interface ReviewQualityInputRecord {
  id: string;
  text: string;
  sentiment?: SentimentLabel;
  confidence?: number;
}

export interface ReviewQualityFlag {
  recordId: string;
  isSuspicious: boolean;
  riskLevel: ReviewRiskLevel;
  reasons: string[];
  evidence: string[];
  suggestedAction: string;
  score: number;
}

const GENERIC_PHRASES = [
  "good",
  "good product",
  "nice",
  "nice product",
  "excellent",
  "excellent product",
  "best product",
  "very good",
  "awesome",
  "amazing",
  "bad",
  "bad product",
  "worst",
  "not good",
  "ok",
  "okay",
  "fine"
];

const GENERIC_ADJECTIVES = new Set([
  "good",
  "nice",
  "excellent",
  "awesome",
  "amazing",
  "best",
  "bad",
  "worst",
  "fine",
  "ok",
  "okay",
  "great",
  "perfect",
  "super",
  "poor"
]);

const CONCRETE_TERMS = [
  "battery",
  "screen",
  "camera",
  "sound",
  "delivery",
  "packing",
  "price",
  "quality",
  "service",
  "support",
  "refund",
  "warranty",
  "size",
  "fit",
  "material",
  "performance",
  "speed",
  "design",
  "durability",
  "charging",
  "speaker",
  "display",
  "policy",
  "leadership",
  "communication",
  "response",
  "staff",
  "app",
  "website",
  "order",
  "feature",
  "issue",
  "problem",
  "update",
  "plan",
  ...showcaseUseCases.flatMap((useCase) => [...useCase.terms])
];

const PROMOTIONAL_TERMS = [
  "buy now",
  "limited offer",
  "100% recommended",
  "must buy",
  "guaranteed",
  "life changing",
  "best ever",
  "do not miss",
  "five star only",
  "sponsored",
  "promo"
];

export function flagReviewQuality(records: ReviewQualityInputRecord[]): ReviewQualityFlag[] {
  const normalizedRecords = records.map((record) => ({
    ...record,
    normalized: normalizeReview(record.text),
    tokens: tokenize(record.text)
  }));

  return normalizedRecords.map((record, index) => {
    const reasons: string[] = [];
    const evidence: string[] = [];
    let score = 0;

    const wordCount = record.tokens.length;
    const lowerText = record.text.toLowerCase();
    const previousRecords = normalizedRecords.slice(0, index);
    const duplicate = record.normalized ? previousRecords.find((candidate) => candidate.normalized === record.normalized) : undefined;
    const nearDuplicate = previousRecords.find((candidate) => areNearDuplicates(record.tokens, candidate.tokens));

    if (record.text.trim().length < 18 || wordCount <= 3) {
      score += 2;
      reasons.push("Low-detail review");
      evidence.push(`Only ${wordCount} word${wordCount === 1 ? "" : "s"} after cleaning.`);
    }

    if (isGenericPhrase(record.normalized) || isGenericAdjectiveOnly(record.tokens)) {
      score += 2;
      reasons.push("Potentially generic wording");
      evidence.push("Uses a common short praise/complaint phrase without supporting detail.");
    }

    if (!hasConcreteTerm(lowerText) && wordCount <= 8) {
      score += 1;
      reasons.push("No concrete feature mentioned");
      evidence.push("No product, service, feature, or issue term was found in the short text.");
    }

    if (duplicate) {
      score += 4;
      reasons.push("Repeated review text");
      evidence.push(`Same cleaned text already appeared in record ${duplicate.id}.`);
    } else if (nearDuplicate) {
      score += 3;
      reasons.push("Near-duplicate wording");
      evidence.push(`Very similar wording appeared in record ${nearDuplicate.id}.`);
    }

    if (hasExcessivePunctuation(record.text) || hasRepeatedCharacters(record.text)) {
      score += 1;
      reasons.push("Unusual punctuation or repeated characters");
      evidence.push("Text contains repeated punctuation or repeated characters.");
    }

    if (record.sentiment && record.sentiment !== "neutral" && (record.confidence ?? 0) >= 0.7 && wordCount <= 6) {
      score += 2;
      reasons.push("Strong sentiment with very little detail");
      evidence.push(`Sentiment is ${record.sentiment}, but the text has limited supporting information.`);
    }

    if (PROMOTIONAL_TERMS.some((term) => lowerText.includes(term))) {
      score += 2;
      reasons.push("Promotional-looking language");
      evidence.push("Contains promotional or sales-like wording.");
    }

    if (hasRepeatedPhrase(record.tokens)) {
      score += 2;
      reasons.push("Repeated phrase pattern");
      evidence.push("The same phrase appears repeatedly in the same record.");
    }

    const riskLevel = calculateRiskLevel(score);
    const isSuspicious = score >= 3;

    return {
      recordId: record.id,
      isSuspicious,
      riskLevel,
      reasons: reasons.length ? Array.from(new Set(reasons)) : ["No obvious low-quality pattern"],
      evidence: evidence.length ? evidence : ["Record has enough detail for ordinary manual review."],
      suggestedAction: getSuggestedAction(isSuspicious, riskLevel),
      score
    };
  });
}

export function summarizeReviewQuality(flags: ReviewQualityFlag[]) {
  const suspiciousCount = flags.filter((flag) => flag.isSuspicious).length;
  const highRiskCount = flags.filter((flag) => flag.riskLevel === "high").length;
  const mediumRiskCount = flags.filter((flag) => flag.riskLevel === "medium").length;
  const lowRiskCount = flags.filter((flag) => flag.riskLevel === "low").length;

  return {
    suspiciousCount,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    suspiciousPercentage: flags.length ? Math.round((suspiciousCount / flags.length) * 100) : 0
  };
}

function normalizeReview(text: string) {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string) {
  return normalizeReview(text)
    .split(" ")
    .filter((token) => token.length > 0);
}

function isGenericPhrase(normalized: string) {
  return GENERIC_PHRASES.includes(normalized);
}

function isGenericAdjectiveOnly(tokens: string[]) {
  if (!tokens.length || tokens.length > 4) {
    return false;
  }

  const meaningfulTokens = tokens.filter((token) => !["very", "so", "too", "really", "product", "item"].includes(token));
  return meaningfulTokens.length > 0 && meaningfulTokens.every((token) => GENERIC_ADJECTIVES.has(token));
}

function hasConcreteTerm(lowerText: string) {
  return CONCRETE_TERMS.some((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(lowerText));
}

function hasExcessivePunctuation(text: string) {
  return /[!?]{3,}/.test(text);
}

function hasRepeatedCharacters(text: string) {
  return /([a-zA-Z])\1{3,}/.test(text);
}

function hasRepeatedPhrase(tokens: string[]) {
  if (tokens.length < 6) {
    return false;
  }

  const bigrams = tokens.slice(0, -1).map((token, index) => `${token} ${tokens[index + 1]}`);
  return bigrams.some((bigram, index) => bigrams.indexOf(bigram) !== index);
}

function areNearDuplicates(tokensA: string[], tokensB: string[]) {
  if (tokensA.length < 4 || tokensB.length < 4) {
    return false;
  }

  const a = new Set(tokensA);
  const b = new Set(tokensB);
  const intersection = Array.from(a).filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union > 0 && intersection / union >= 0.86;
}

function calculateRiskLevel(score: number): ReviewRiskLevel {
  if (score >= 5) {
    return "high";
  }

  if (score >= 3) {
    return "medium";
  }

  return "low";
}

function getSuggestedAction(isSuspicious: boolean, riskLevel: ReviewRiskLevel) {
  if (!isSuspicious) {
    return "Keep as ordinary evidence, while still allowing human review.";
  }

  if (riskLevel === "high") {
    return "Do not use this record alone as strong evidence; manually verify and compare with detailed reviews.";
  }

  return "Treat as weak evidence and prioritize more detailed reviews before making a judgement.";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
