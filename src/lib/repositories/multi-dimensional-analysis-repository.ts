import type { MultiDimensionalAnalysisResult } from "@/types/analysis";

const STORAGE_KEY = "uoip.deep-analysis-results.v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function writeResults(results: MultiDimensionalAnalysisResult[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

export function readMultiDimensionalAnalysisResults(): MultiDimensionalAnalysisResult[] {
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

export function findMultiDimensionalAnalysisByProjectId(projectId: string) {
  return readMultiDimensionalAnalysisResults().find((result) => result.projectId === projectId);
}

export function saveMultiDimensionalAnalysisResult(result: MultiDimensionalAnalysisResult) {
  const otherResults = readMultiDimensionalAnalysisResults().filter((item) => item.projectId !== result.projectId);
  writeResults([result, ...otherResults]);
  return result;
}

export function deleteMultiDimensionalAnalysisByProjectId(projectId: string) {
  writeResults(readMultiDimensionalAnalysisResults().filter((result) => result.projectId !== projectId));
}
