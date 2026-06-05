"use client";

import { AlertTriangle, Gauge, HeartPulse, ShieldCheck, TrendingUp } from "lucide-react";
import { InsightCard } from "@/components/insight-card";
import { SentimentCharts } from "@/components/sentiment-charts";
import type { AnalysisResult, SentimentLabel, SentimentRecordResult } from "@/types/analysis";
import {
  getAverageConfidence,
  getDominantSentiment,
  getHealthDescription,
  getHealthLabel,
  getRiskLevel,
  getTopSentimentRecords
} from "@/lib/services/sentiment-insight-service";

interface SentimentDashboardProps {
  result: AnalysisResult;
}

export function SentimentDashboard({ result }: SentimentDashboardProps) {
  const dominantSentiment = getDominantSentiment(result);
  const riskLevel = getRiskLevel(result.summary.negativePercentage);
  const averageConfidence = getAverageConfidence(result);
  const topPositiveRecords = getTopSentimentRecords(result.records, "positive");
  const topNegativeRecords = getTopSentimentRecords(result.records, "negative");

  return (
    <section className="mt-8">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold text-primary">Visual Intelligence Dashboard</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Sentiment overview</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Visual insights generated only from the saved rule-based sentiment analysis result.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Total analysed" value={result.summary.totalAnalysed} />
        <MetricTile label="Positive" percentage={result.summary.positivePercentage} tone="positive" value={result.summary.positiveCount} />
        <MetricTile label="Negative" percentage={result.summary.negativePercentage} tone="negative" value={result.summary.negativeCount} />
        <MetricTile label="Neutral" percentage={result.summary.neutralPercentage} tone="neutral" value={result.summary.neutralCount} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          description={getHealthDescription(result.summary.positivePercentage, result.summary.negativePercentage)}
          icon={HeartPulse}
          label="Overall sentiment health"
          tone={getHealthTone(result.summary.positivePercentage, result.summary.negativePercentage)}
          value={getHealthLabel(result.summary.positivePercentage, result.summary.negativePercentage)}
        />
        <InsightCard
          description={`${result.summary.negativePercentage}% of analysed records are negative.`}
          icon={ShieldCheck}
          label="Risk level"
          tone={riskLevel === "High" ? "negative" : riskLevel === "Medium" ? "warning" : "positive"}
          value={riskLevel}
        />
        <InsightCard
          description="Largest sentiment segment across analysed records."
          icon={TrendingUp}
          label="Dominant sentiment"
          tone={dominantSentiment}
          value={capitalize(dominantSentiment)}
        />
        <InsightCard
          description="Average confidence of the current baseline sentiment engine."
          icon={Gauge}
          label="Average confidence"
          tone="neutral"
          value={`${averageConfidence}%`}
        />
      </div>

      <div className="mt-6">
        <SentimentCharts result={result} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <TopRecordsCard
          emptyText="No positive records were detected."
          records={topPositiveRecords}
          title="Top positive records"
          tone="positive"
        />
        <TopRecordsCard
          emptyText="No negative records were detected."
          records={topNegativeRecords}
          title="Top negative records"
          tone="negative"
        />
      </div>
    </section>
  );
}

function MetricTile({
  label,
  percentage,
  tone = "neutral",
  value
}: {
  label: string;
  percentage?: number;
  tone?: SentimentLabel;
  value: number;
}) {
  return (
    <div className="rounded-md border bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      {percentage !== undefined ? (
        <div className="mt-3">
          <div className="h-2 rounded-full bg-slate-100">
            <div className={getMetricBarClassName(tone)} style={{ width: `${percentage}%` }} />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-500">{percentage}% of analysed records</p>
        </div>
      ) : (
        <p className="mt-2 text-sm font-semibold text-slate-500">Analysed records</p>
      )}
    </div>
  );
}

function TopRecordsCard({
  emptyText,
  records,
  title,
  tone
}: {
  emptyText: string;
  records: SentimentRecordResult[];
  title: string;
  tone: "positive" | "negative";
}) {
  return (
    <div className="rounded-md border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        <AlertTriangle className={tone === "negative" ? "h-5 w-5 text-red-600" : "h-5 w-5 text-teal-600"} />
      </div>
      {records.length === 0 ? (
        <p className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {records.map((record) => (
            <div className="rounded-md border bg-slate-50 p-4" key={record.id}>
              <div className="flex items-center justify-between gap-3">
                <span className={tone === "negative" ? "text-xs font-bold uppercase tracking-wide text-red-700" : "text-xs font-bold uppercase tracking-wide text-teal-700"}>
                  {record.sentiment}
                </span>
                <span className="text-xs font-bold text-slate-500">{Math.round(record.confidence * 100)}%</span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">{record.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getHealthTone(positivePercentage: number, negativePercentage: number) {
  if (negativePercentage >= 50) {
    return "negative";
  }

  if (positivePercentage >= 50) {
    return "positive";
  }

  return "warning";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getMetricBarClassName(sentiment: SentimentLabel) {
  if (sentiment === "positive") {
    return "h-2 rounded-full bg-teal-600";
  }

  if (sentiment === "negative") {
    return "h-2 rounded-full bg-red-600";
  }

  return "h-2 rounded-full bg-slate-500";
}
