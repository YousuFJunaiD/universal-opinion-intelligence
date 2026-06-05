import type { BenchmarkDataset, ModelEvaluationResult } from "@/types/evaluation";

const BENCHMARK_DATASETS_KEY = "uoip.benchmark-datasets";
const EVALUATION_RESULTS_KEY = "uoip.model-evaluation-results";

export function saveBenchmarkDataset(dataset: BenchmarkDataset) {
  const datasets = getBenchmarkDatasets().filter((item) => item.id !== dataset.id);
  datasets.unshift(dataset);
  window.localStorage.setItem(BENCHMARK_DATASETS_KEY, JSON.stringify(datasets));
}

export function getBenchmarkDatasets(): BenchmarkDataset[] {
  if (typeof window === "undefined") {
    return [];
  }

  return readArray<BenchmarkDataset>(BENCHMARK_DATASETS_KEY);
}

export function saveModelEvaluationResult(result: ModelEvaluationResult) {
  const results = getModelEvaluationResults().filter((item) => item.id !== result.id);
  results.unshift(result);
  window.localStorage.setItem(EVALUATION_RESULTS_KEY, JSON.stringify(results));
}

export function getModelEvaluationResults(): ModelEvaluationResult[] {
  if (typeof window === "undefined") {
    return [];
  }

  return readArray<ModelEvaluationResult>(EVALUATION_RESULTS_KEY);
}

function readArray<TItem>(key: string): TItem[] {
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TItem[]) : [];
  } catch {
    return [];
  }
}
