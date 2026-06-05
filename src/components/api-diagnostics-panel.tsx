"use client";

import { useEffect, useState } from "react";
import { Bug } from "lucide-react";
import {
  readLatestApiDiagnostic,
  subscribeToApiDiagnostics,
  type ApiDiagnosticEntry
} from "@/lib/api/client";

export function ApiDiagnosticsPanel() {
  const [latest, setLatest] = useState<ApiDiagnosticEntry | null>(null);

  useEffect(() => {
    setLatest(readLatestApiDiagnostic());
    return subscribeToApiDiagnostics(() => setLatest(readLatestApiDiagnostic()));
  }, []);

  return (
    <div className="mt-3 rounded-md border bg-white p-3 text-xs text-slate-600">
      <div className="flex items-center gap-2 font-bold text-slate-800">
        <Bug className="h-3.5 w-3.5 text-primary" />
        API diagnostics
      </div>
      {latest ? (
        <div className="mt-2 grid gap-1">
          <p>
            Last call: <span className="font-bold">{latest.route}</span>
          </p>
          <p>
            Status: <span className={latest.status === "success" ? "font-bold text-teal-700" : "font-bold text-red-700"}>{latest.status}</span>
          </p>
          <p>{new Date(latest.timestamp).toLocaleTimeString()}</p>
          {latest.errorMessage ? <p className="text-red-700">{latest.errorMessage}</p> : null}
        </div>
      ) : (
        <p className="mt-2">No shadow calls yet.</p>
      )}
    </div>
  );
}
