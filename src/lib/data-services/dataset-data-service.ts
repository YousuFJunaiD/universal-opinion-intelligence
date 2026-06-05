"use client";

import {
  createDataset as createDatasetApi,
  deleteDataset as deleteDatasetApi,
  getDatasetsByProjectId as getDatasetsByProjectIdApi
} from "@/lib/api/client";
import { DATA_MODE, runApiShadowCall } from "@/lib/data-mode";
import { updateProjectStatus } from "@/lib/projects";
import {
  deleteDatasetById,
  deleteDatasetByProjectId,
  findDatasetByProjectId,
  saveDataset
} from "@/lib/repositories/dataset-repository";
import { clearAnalysisDataForNewDataset } from "@/lib/data-services/analysis-data-service";
import { clearReportData } from "@/lib/data-services/report-data-service";
import type { Dataset } from "@/types/dataset";

export async function saveDatasetData(dataset: Dataset) {
  if (DATA_MODE === "api") {
    await createDatasetApi(toDatasetCreateRequest(dataset));
    return dataset;
  }

  const savedDataset = saveDataset(dataset);
  updateProjectStatus(savedDataset.projectId, "Data Added");
  runApiShadowCall(() => createDatasetApi(toDatasetCreateRequest(savedDataset)));
  return savedDataset;
}

export async function getDatasetsForProject(projectId: string) {
  if (DATA_MODE === "api") {
    return (await getDatasetsByProjectIdApi(projectId)).datasets;
  }

  const dataset = findDatasetByProjectId(projectId);
  return dataset ? [dataset] : [];
}

export async function deleteDatasetData(dataset: Dataset) {
  if (DATA_MODE === "api") {
    await deleteDatasetApi(dataset.id);
    return;
  }

  deleteDatasetById(dataset.id);
  await clearAnalysisDataForNewDataset(dataset.projectId);
  await clearReportData(dataset.projectId);
  updateProjectStatus(dataset.projectId, "Draft");
  runApiShadowCall(() => deleteDatasetApi(dataset.id));
}

export async function replaceDatasetData(dataset: Dataset) {
  if (DATA_MODE !== "api") {
    deleteDatasetByProjectId(dataset.projectId);
  }

  return saveDatasetData(dataset);
}

function toDatasetCreateRequest(dataset: Dataset) {
  return {
    id: dataset.id,
    projectId: dataset.projectId,
    sourceType: dataset.sourceType,
    records: dataset.records.map((record) => record.text),
    fileName: dataset.fileName,
    selectedColumn: dataset.selectedColumn,
    columns: dataset.columns
  };
}
