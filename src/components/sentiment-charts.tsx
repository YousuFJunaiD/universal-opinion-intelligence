"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { AnalysisResult } from "@/types/analysis";

const SENTIMENT_COLORS = {
  positive: "#0f766e",
  negative: "#dc2626",
  neutral: "#64748b"
};

interface SentimentChartsProps {
  result: AnalysisResult;
}

export function SentimentCharts({ result }: SentimentChartsProps) {
  const sentimentData = [
    {
      label: "Positive",
      name: "positive",
      value: result.summary.positiveCount
    },
    {
      label: "Negative",
      name: "negative",
      value: result.summary.negativeCount
    },
    {
      label: "Neutral",
      name: "neutral",
      value: result.summary.neutralCount
    }
  ];
  const confidenceData = buildConfidenceDistribution(result);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <ChartFrame title="Sentiment Distribution" subtitle="Share of analysed records by label">
        <ResponsiveContainer height={280} width="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={sentimentData}
              dataKey="value"
              innerRadius={68}
              outerRadius={104}
              paddingAngle={3}
              nameKey="label"
            >
              {sentimentData.map((entry) => (
                <Cell fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS]} key={entry.name} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${Number(value ?? 0)} records`, String(name)]} />
          </PieChart>
        </ResponsiveContainer>
        <Legend />
      </ChartFrame>

      <ChartFrame title="Sentiment Counts" subtitle="Positive, negative, and neutral volume">
        <ResponsiveContainer height={280} width="100%">
          <BarChart data={sentimentData} margin={{ bottom: 8, left: -18, right: 10, top: 10 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
            <Tooltip formatter={(value) => [`${Number(value ?? 0)} records`, "Count"]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {sentimentData.map((entry) => (
                <Cell fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS]} key={entry.name} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <div className="xl:col-span-2">
        <ChartFrame title="Confidence Distribution" subtitle="Record confidence grouped into percentage ranges">
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={confidenceData} margin={{ bottom: 8, left: -18, right: 10, top: 10 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
              <Tooltip formatter={(value) => [`${Number(value ?? 0)} records`, "Confidence bucket"]} />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
    </div>
  );
}

function ChartFrame({
  children,
  subtitle,
  title
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="rounded-md border bg-white p-5">
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs font-bold uppercase tracking-wide text-slate-500">
      <LegendItem color={SENTIMENT_COLORS.positive} label="Positive" />
      <LegendItem color={SENTIMENT_COLORS.negative} label="Negative" />
      <LegendItem color={SENTIMENT_COLORS.neutral} label="Neutral" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function buildConfidenceDistribution(result: AnalysisResult) {
  const buckets = [
    { count: 0, max: 0.6, min: 0, range: "0-60%" },
    { count: 0, max: 0.7, min: 0.6, range: "60-70%" },
    { count: 0, max: 0.8, min: 0.7, range: "70-80%" },
    { count: 0, max: 0.9, min: 0.8, range: "80-90%" },
    { count: 0, max: 1.01, min: 0.9, range: "90-100%" }
  ];

  result.records.forEach((record) => {
    const bucket = buckets.find((item) => record.confidence >= item.min && record.confidence < item.max);
    if (bucket) {
      bucket.count += 1;
    }
  });

  return buckets.map(({ count, range }) => ({ count, range }));
}
