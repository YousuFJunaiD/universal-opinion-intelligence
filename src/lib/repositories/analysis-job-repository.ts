import type { AnalysisJob, AnalysisJobStatus } from "@/types/analysis";

const STORAGE_KEY = "uoip.analysis-jobs.v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function writeJobs(jobs: AnalysisJob[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function readAnalysisJobs(): AnalysisJob[] {
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

export function findAnalysisJobByProjectId(projectId: string) {
  return readAnalysisJobs().find((job) => job.projectId === projectId);
}

export function createAnalysisJob(projectId: string, datasetId: string): AnalysisJob {
  const now = new Date().toISOString();
  const job: AnalysisJob = {
    id: crypto.randomUUID(),
    projectId,
    datasetId,
    status: "pending",
    createdAt: now,
    updatedAt: now
  };

  const otherJobs = readAnalysisJobs().filter((item) => item.projectId !== projectId);
  writeJobs([job, ...otherJobs]);
  return job;
}

export function updateAnalysisJob(
  jobId: string,
  updates: {
    failureReason?: string;
    preparedDatasetId?: string;
    status?: AnalysisJobStatus;
  }
) {
  let updatedJob: AnalysisJob | undefined;
  const jobs = readAnalysisJobs().map((job) => {
    if (job.id !== jobId) {
      return job;
    }

    updatedJob = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return updatedJob;
  });

  writeJobs(jobs);
  return updatedJob;
}

export function deleteAnalysisJobByProjectId(projectId: string) {
  writeJobs(readAnalysisJobs().filter((job) => job.projectId !== projectId));
}
