"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Brain, Layers3, MessageCircleQuestion, ShieldAlert } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { MultiDimensionalAnalysisResult } from "@/types/analysis";

interface DeepAnalysisDashboardProps {
  result: MultiDimensionalAnalysisResult;
}

export function DeepAnalysisDashboard({ result }: DeepAnalysisDashboardProps) {
  const emotionData = Object.entries(result.emotionDistribution).map(([label, count]) => ({ count, label }));
  const stanceData = Object.entries(result.stanceDistribution).map(([label, count]) => ({ count, label }));

  return (
    <section className="mt-8 rounded-md border bg-white p-6">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold text-primary">Phase 8</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Multi-Dimensional Analysis</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Deterministic local baseline for emotion, stance, aspects, and risk signals. Replaceable by FastAPI/ML later.
          </p>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
          {result.records.length} records analysed
        </span>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ChartPanel icon={Brain} title="Emotion distribution">
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={emotionData} margin={{ bottom: 8, left: -18, right: 10, top: 10 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
              <Tooltip formatter={(value) => [`${Number(value ?? 0)} records`, "Emotion"]} />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel icon={MessageCircleQuestion} title="Stance distribution">
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={stanceData} margin={{ bottom: 8, left: -18, right: 10, top: 10 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
              <Tooltip formatter={(value) => [`${Number(value ?? 0)} records`, "Stance"]} />
              <Bar dataKey="count" fill="#0f766e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel icon={Layers3} title="Top detected aspects">
          {result.aspects.length === 0 ? (
            <EmptyState text="No repeated aspects were detected." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.aspects.map((aspect) => (
                <span className="rounded-md border bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700" key={aspect.aspect}>
                  {aspect.aspect} · {aspect.count}
                </span>
              ))}
            </div>
          )}
        </Panel>

        <Panel icon={ShieldAlert} title="Risk signals">
          {result.riskSignals.length === 0 ? (
            <EmptyState text="No deterministic risk signals were detected." />
          ) : (
            <div className="space-y-3">
              {result.riskSignals.map((signal) => (
                <div className="rounded-md border bg-slate-50 p-4" key={signal.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-950">{signal.label}</p>
                    <span className={getSeverityClassName(signal.severity)}>{signal.severity}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {signal.count} records · {signal.matchedKeywords.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border">
        <div className="border-b bg-slate-50 px-5 py-4">
          <h3 className="text-base font-bold text-slate-950">Deep analysis record table</h3>
          <p className="mt-1 text-sm text-slate-500">Emotion, stance, aspects, and risk signals for each prepared record.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-16 px-4 py-3">No.</th>
                <th className="px-4 py-3">Text</th>
                <th className="w-28 px-4 py-3">Emotion</th>
                <th className="w-32 px-4 py-3">Stance</th>
                <th className="w-44 px-4 py-3">Aspects</th>
                <th className="w-48 px-4 py-3">Risks</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {result.records.map((record, index) => (
                <tr key={record.id}>
                  <td className="px-4 py-3 align-top font-semibold text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 leading-6 text-slate-800">{record.text}</td>
                  <td className="px-4 py-3 align-top">
                    <Badge>{record.emotion}</Badge>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge>{record.stance}</Badge>
                  </td>
                  <td className="px-4 py-3 align-top text-slate-700">{record.aspects.join(", ") || "none"}</td>
                  <td className="px-4 py-3 align-top text-slate-700">{record.riskSignals.join(", ") || "none"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ChartPanel({ children, icon: Icon, title }: { children: ReactNode; icon: typeof Brain; title: string }) {
  return (
    <div className="rounded-md border bg-white p-5">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Panel({ children, icon: Icon, title }: { children: ReactNode; icon: typeof AlertTriangle; title: string }) {
  return (
    <div className="rounded-md border bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">{text}</p>;
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{children}</span>;
}

function getSeverityClassName(severity: string) {
  if (severity === "high") {
    return "rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-red-700";
  }

  if (severity === "medium") {
    return "rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-800";
  }

  return "rounded-md bg-teal-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-teal-800";
}
