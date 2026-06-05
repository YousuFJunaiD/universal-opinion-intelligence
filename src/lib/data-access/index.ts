import { DATA_ACCESS_MODE } from "@/lib/data-access/config";
import { LocalStorageAnalysisRepository } from "@/lib/data-access/local-storage/analysis-repository";
import { LocalStorageDatasetRepository } from "@/lib/data-access/local-storage/dataset-repository";
import { LocalStorageProjectRepository } from "@/lib/data-access/local-storage/project-repository";
import { PostgresAnalysisRepository } from "@/lib/data-access/postgres/analysis-repository";
import { PostgresDatasetRepository } from "@/lib/data-access/postgres/dataset-repository";
import { PostgresProjectRepository } from "@/lib/data-access/postgres/project-repository";

export function createProjectRepository() {
  if (DATA_ACCESS_MODE === "postgres") {
    return new PostgresProjectRepository();
  }

  return new LocalStorageProjectRepository();
}

export function createDatasetRepository() {
  if (DATA_ACCESS_MODE === "postgres") {
    return new PostgresDatasetRepository();
  }

  return new LocalStorageDatasetRepository();
}

export function createAnalysisRepository() {
  if (DATA_ACCESS_MODE === "postgres") {
    return new PostgresAnalysisRepository();
  }

  return new LocalStorageAnalysisRepository();
}
