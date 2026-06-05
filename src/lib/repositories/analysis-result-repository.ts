import type { AnalysisResult } from "@/types/analysis";

const STORAGE_KEY = "uoip.analysis-results.v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function writeResults(results: AnalysisResult[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

export function readAnalysisResults(): AnalysisResult[] {
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

export function findAnalysisResultByProjectId(projectId: string) {
  return readAnalysisResults().find((result) => result.projectId === projectId);
}

export function saveAnalysisResult(result: AnalysisResult) {
  const otherResults = readAnalysisResults().filter((item) => item.projectId !== result.projectId);
  writeResults([result, ...otherResults]);
  return result;
}

export function deleteAnalysisResultByProjectId(projectId: string) {
  writeResults(readAnalysisResults().filter((result) => result.projectId !== projectId));
}
