import type { ReportExport } from "@/types/report";

const STORAGE_KEY = "uoip.report-exports.v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function writeExports(exports: ReportExport[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(exports));
}

export function readReportExports(): ReportExport[] {
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

export function findReportExportsByProjectId(projectId: string) {
  return readReportExports().filter((item) => item.projectId === projectId);
}

export function saveReportExport(reportExport: ReportExport) {
  const exports = readReportExports();
  writeExports([reportExport, ...exports]);
  return reportExport;
}

export function deleteReportExportsByProjectId(projectId: string) {
  writeExports(readReportExports().filter((item) => item.projectId !== projectId));
}
