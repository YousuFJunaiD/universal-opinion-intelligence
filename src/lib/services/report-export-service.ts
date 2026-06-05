import type { ReportExport, ReportSnapshot } from "@/types/report";

export function createReportExport(snapshot: ReportSnapshot): ReportExport {
  return {
    exportId: crypto.randomUUID(),
    reportSnapshotId: snapshot.id,
    projectId: snapshot.projectId,
    exportedAt: new Date().toISOString(),
    exportType: "pdf-print"
  };
}

export function printReport() {
  window.print();
}
