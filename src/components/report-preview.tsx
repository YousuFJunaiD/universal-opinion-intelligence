"use client";

import { Download, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrintableReport } from "@/components/printable-report";
import type { ReportExport, ReportSnapshot } from "@/types/report";

interface ReportPreviewProps {
  exportHistory: ReportExport[];
  onExportPdf: () => void;
  snapshot: ReportSnapshot;
}

export function ReportPreview({ exportHistory, onExportPdf, snapshot }: ReportPreviewProps) {
  return (
    <section className="mt-8">
      <div className="no-print mb-4 flex flex-col justify-between gap-4 rounded-md border bg-white p-5 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-primary">PDF Export</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Printable report preview</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Uses your browser print dialog. Choose “Save as PDF” to export the report.
          </p>
        </div>
        <Button onClick={onExportPdf}>
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <PrintableReport snapshot={snapshot} />

      <Card className="no-print mt-6 p-5">
        <div className="flex items-center gap-3 border-b pb-4">
          <History className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-slate-950">Export history</h3>
        </div>
        {exportHistory.length === 0 ? (
          <p className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            No exports recorded yet.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-md border">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Export ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Exported</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {exportHistory.map((item) => (
                  <tr key={item.exportId}>
                    <td className="px-4 py-3 font-semibold text-slate-700">{item.exportId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-slate-700">{item.exportType}</td>
                    <td className="px-4 py-3 text-slate-700">{new Date(item.exportedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
