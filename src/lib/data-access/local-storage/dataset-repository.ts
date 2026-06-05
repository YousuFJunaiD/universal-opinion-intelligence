import type { Dataset } from "@/types/dataset";
import {
  findDatasetByProjectId,
  readDatasets,
  saveDataset
} from "@/lib/repositories/dataset-repository";

export class LocalStorageDatasetRepository {
  findByProjectId(projectId: string) {
    return findDatasetByProjectId(projectId);
  }

  list(): Dataset[] {
    return readDatasets();
  }

  save(dataset: Dataset) {
    return saveDataset(dataset);
  }
}
