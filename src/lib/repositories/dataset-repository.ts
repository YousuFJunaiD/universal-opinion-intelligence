import type { Dataset } from "@/types/dataset";

const STORAGE_KEY = "uoip.datasets.v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function writeDatasets(datasets: Dataset[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
}

export function readDatasets(): Dataset[] {
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

export function findDatasetByProjectId(projectId: string) {
  return readDatasets().find((dataset) => dataset.projectId === projectId);
}

export function saveDataset(dataset: Dataset) {
  const otherDatasets = readDatasets().filter((item) => item.projectId !== dataset.projectId);
  writeDatasets([dataset, ...otherDatasets]);
  return dataset;
}

export function deleteDatasetByProjectId(projectId: string) {
  writeDatasets(readDatasets().filter((dataset) => dataset.projectId !== projectId));
}

export function deleteDatasetById(datasetId: string) {
  writeDatasets(readDatasets().filter((dataset) => dataset.id !== datasetId));
}
