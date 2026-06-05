import type { PreparedDataset } from "@/types/analysis";

const STORAGE_KEY = "uoip.prepared-datasets.v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function writePreparedDatasets(datasets: PreparedDataset[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
}

export function readPreparedDatasets(): PreparedDataset[] {
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

export function findPreparedDatasetByProjectId(projectId: string) {
  return readPreparedDatasets().find((dataset) => dataset.projectId === projectId);
}

export function savePreparedDataset(dataset: PreparedDataset) {
  const otherDatasets = readPreparedDatasets().filter((item) => item.projectId !== dataset.projectId);
  writePreparedDatasets([dataset, ...otherDatasets]);
  return dataset;
}

export function deletePreparedDatasetByProjectId(projectId: string) {
  writePreparedDatasets(readPreparedDatasets().filter((dataset) => dataset.projectId !== projectId));
}
