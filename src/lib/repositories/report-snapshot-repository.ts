import type { ReportSnapshot } from "@/types/report";

const STORAGE_KEY = "uoip.report-snapshots.v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function writeSnapshots(snapshots: ReportSnapshot[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
}

export function readReportSnapshots(): ReportSnapshot[] {
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

export function findReportSnapshotByProjectId(projectId: string) {
  return readReportSnapshots().find((snapshot) => snapshot.projectId === projectId);
}

export function saveReportSnapshot(snapshot: ReportSnapshot) {
  const otherSnapshots = readReportSnapshots().filter((item) => item.projectId !== snapshot.projectId);
  writeSnapshots([snapshot, ...otherSnapshots]);
  return snapshot;
}

export function deleteReportSnapshotByProjectId(projectId: string) {
  writeSnapshots(readReportSnapshots().filter((snapshot) => snapshot.projectId !== projectId));
}
