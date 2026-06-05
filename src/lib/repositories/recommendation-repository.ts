import type { RecommendationResult } from "@/types/recommendation";

const STORAGE_KEY = "uoip.recommendation-results.v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function writeResults(results: RecommendationResult[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

export function readRecommendationResults(): RecommendationResult[] {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function findRecommendationResultByProjectId(projectId: string) {
  return readRecommendationResults().find((result) => result.projectId === projectId);
}

export function saveRecommendationResult(result: RecommendationResult) {
  const otherResults = readRecommendationResults().filter((item) => item.projectId !== result.projectId);
  writeResults([result, ...otherResults]);
  return result;
}

export function deleteRecommendationResultByProjectId(projectId: string) {
  writeResults(readRecommendationResults().filter((result) => result.projectId !== projectId));
}
