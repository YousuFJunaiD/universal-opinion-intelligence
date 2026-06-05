"use client";

import type { ReactNode } from "react";
import { ClipboardCheck, FileText, Lightbulb, ShieldCheck } from "lucide-react";
import type { ReportSnapshot } from "@/types/report";

interface PrintableReportProps {
  snapshot: ReportSnapshot;
}

export function PrintableReport({ snapshot }: PrintableReportProps) {
  const sentimentMetadata = snapshot.modelMetadata?.sentiment ?? {
    provider: "rule-based",
    modelName: "Rule-Based Baseline",
    modelVersion: "1.0.0",
    confidence: 0,
    processingTimeMs: 0
  };

  return (
    <article className="printable-report overflow-hidden rounded-md border bg-white shadow-soft" id="printable-report">
      <section className="report-title-page border-b bg-slate-950 px-6 py-10 text-white md:px-10">
        <p className="text-sm font-semibold text-teal-200">Universal Opinion Intelligence Platform</p>
        <h2 className="mt-3 max-w-4xl text-3xl font-bold leading-tight">{snapshot.title}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
          Export-ready report snapshot generated from saved analysis data.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <TitleMetric label="Project" value={snapshot.projectDetails.projectName} />
          <TitleMetric label="Generated" value={new Date(snapshot.createdAt).toLocaleDateString()} />
          <TitleMetric label="Status" value={snapshot.projectDetails.status} />
        </div>
      </section>

      <section className="report-section px-6 py-6 md:px-10">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <ReportPanel title="Executive summary">
            <p className="text-sm leading-7 text-slate-700">{snapshot.executiveSummary}</p>
          </ReportPanel>

          <ReportPanel title="Project overview">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Analysis type" value={snapshot.projectDetails.analysisType} />
              <Metric label="Goal" value={snapshot.projectDetails.goal} />
              <Metric label="Source type" value={formatSource(snapshot.datasetDetails.sourceType)} />
              <Metric label="Report status" value={snapshot.projectDetails.status} />
            </div>
          </ReportPanel>
        </div>
      </section>

      <section className="report-section px-6 pb-6 md:px-10">
        <div className="grid gap-4 lg:grid-cols-2">
          <ReportPanel title="Dataset summary">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Original records" value={String(snapshot.datasetDetails.originalRecords)} />
              <Metric label="Clean records" value={String(snapshot.datasetDetails.cleanRecords)} />
              <Metric label="Dataset created" value={new Date(snapshot.datasetDetails.createdAt).toLocaleDateString()} />
              <Metric label="Source type" value={formatSource(snapshot.datasetDetails.sourceType)} />
            </div>
          </ReportPanel>

          <ReportPanel title="Preparation quality summary">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Duplicates removed" value={String(snapshot.preparationSummary.removedDuplicates)} />
              <Metric label="Empty removed" value={String(snapshot.preparationSummary.removedEmptyRecords)} />
              <Metric label="Readiness score" value={`${snapshot.preparationSummary.readinessScore}/100`} />
              <Metric label="Clean ratio" value={`${cleanRatio(snapshot)}%`} />
            </div>
          </ReportPanel>
        </div>
      </section>

      {snapshot.sourceSummary ? (
        <section className="report-section px-6 pb-6 md:px-10">
          <ReportPanel title="Sources and access limitations">
            <p className="text-sm leading-6 text-slate-700">{snapshot.sourceSummary.note}</p>
            {snapshot.sourceSummary.sources.length ? (
              <div className="mt-4 space-y-3">
                {snapshot.sourceSummary.sources.map((source) => (
                  <div className="rounded-md border bg-slate-50 p-3" key={source.url}>
                    <p className="text-sm font-bold text-slate-950">{source.title}</p>
                    <p className="mt-1 break-all text-xs font-semibold text-primary">{source.url}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{source.recordCount} extracted records</p>
                  </div>
                ))}
              </div>
            ) : null}
            {snapshot.sourceSummary.limitations.length ? (
              <div className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {snapshot.sourceSummary.limitations.slice(0, 6).map((limitation) => (
                  <p key={limitation}>{limitation}</p>
                ))}
              </div>
            ) : null}
          </ReportPanel>
        </section>
      ) : null}

      <section className="report-section px-6 pb-6 md:px-10">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <ReportPanel title="Sentiment analysis summary">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Total analysed" value={String(snapshot.sentimentSummary.totalAnalysed)} />
              <Metric label="Positive" value={`${snapshot.sentimentSummary.positiveCount} (${snapshot.sentimentSummary.positivePercentage}%)`} />
              <Metric label="Negative" value={`${snapshot.sentimentSummary.negativeCount} (${snapshot.sentimentSummary.negativePercentage}%)`} />
              <Metric label="Neutral" value={`${snapshot.sentimentSummary.neutralCount} (${snapshot.sentimentSummary.neutralPercentage}%)`} />
            </div>
          </ReportPanel>

          <ReportPanel title="Risk assessment">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Risk level" value={snapshot.sentimentSummary.riskLevel} />
              <Metric label="Dominant sentiment" value={snapshot.sentimentSummary.dominantSentiment} />
              <Metric label="Average confidence" value={`${snapshot.sentimentSummary.averageConfidence}%`} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {snapshot.insights.map((insight) => (
                <div className="avoid-break rounded-md border bg-slate-50 p-4" key={insight.label}>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{insight.label}</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">{insight.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{insight.description}</p>
                </div>
              ))}
            </div>
          </ReportPanel>
        </div>
      </section>

      <section className="report-section px-6 pb-6 md:px-10">
        <ReportPanel title="Model metadata">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Provider" value={sentimentMetadata.provider} />
            <Metric label="Model" value={sentimentMetadata.modelName} />
            <Metric label="Version" value={sentimentMetadata.modelVersion} />
            <Metric label="Processing time" value={`${sentimentMetadata.processingTimeMs} ms`} />
          </div>
          {sentimentMetadata.fallbackFrom ? (
            <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Rule-based baseline was used after {sentimentMetadata.fallbackFrom} failed:{" "}
              {sentimentMetadata.fallbackReason}
            </p>
          ) : sentimentMetadata.provider === "rule-based" ? (
            <p className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              Current engine: rule-based baseline model. Advanced ML adapters can replace this provider without changing the report format.
            </p>
          ) : null}
        </ReportPanel>
      </section>

      <section className="report-section print-page-break px-6 pb-6 md:px-10">
        <div className="grid gap-4 lg:grid-cols-2">
          <EvidenceCard
            emptyText="No positive evidence records were captured."
            records={snapshot.topPositiveRecords}
            title="Positive evidence records"
            tone="positive"
          />
          <EvidenceCard
            emptyText="No negative evidence records were captured."
            records={snapshot.topNegativeRecords}
            title="Negative evidence records"
            tone="negative"
          />
        </div>
      </section>

      {snapshot.deepAnalysisSummary ? (
        <section className="report-section print-page-break px-6 pb-6 md:px-10">
          <div className="grid gap-4 lg:grid-cols-2">
            <ReportPanel title="Deep analysis summary">
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric label="Top emotion" value={topEntry(snapshot.deepAnalysisSummary.emotionDistribution)} />
                <Metric label="Top stance" value={topEntry(snapshot.deepAnalysisSummary.stanceDistribution)} />
                <Metric label="Aspects detected" value={String(snapshot.deepAnalysisSummary.topAspects.length)} />
                <Metric label="Risk signals" value={String(snapshot.deepAnalysisSummary.riskSignals.length)} />
              </div>
            </ReportPanel>
            <ReportPanel title="Top aspects and risks">
              <div className="space-y-3">
                <p className="text-sm leading-6 text-slate-700">
                  Aspects: {snapshot.deepAnalysisSummary.topAspects.slice(0, 8).map((aspect) => `${aspect.aspect} (${aspect.count})`).join(", ") || "none"}
                </p>
                <p className="text-sm leading-6 text-slate-700">
                  Risks: {snapshot.deepAnalysisSummary.riskSignals.slice(0, 6).map((signal) => `${signal.label} (${signal.severity})`).join(", ") || "none"}
                </p>
              </div>
            </ReportPanel>
          </div>
        </section>
      ) : null}

      <section className="report-section px-6 pb-8 md:px-10">
        {snapshot.recommendationSummary ? (
          <ReportPanel title="Recommendations and roadmap">
            <p className="text-sm leading-7 text-slate-700">{snapshot.recommendationSummary.executiveActionSummary}</p>
            <div className="mt-4 grid gap-3">
              {snapshot.recommendationSummary.recommendations.slice(0, 5).map((recommendation) => (
                <div className="avoid-break rounded-md border bg-slate-50 p-4" key={recommendation.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-950">{recommendation.title}</p>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{recommendation.priority}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{recommendation.suggestedAction}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Evidence: {recommendation.evidence.join("; ")}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Metric label="7-day steps" value={String(snapshot.recommendationSummary.roadmap.sevenDay.length)} />
              <Metric label="30-day steps" value={String(snapshot.recommendationSummary.roadmap.thirtyDay.length)} />
              <Metric label="Long-term steps" value={String(snapshot.recommendationSummary.roadmap.longTerm.length)} />
            </div>
          </ReportPanel>
        ) : (
          <div className="avoid-break rounded-md border border-dashed bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-bold text-slate-950">Recommendations placeholder</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{snapshot.recommendationsPlaceholder}</p>
          </div>
        )}
      </section>
    </article>
  );
}

function TitleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}</p>
      <p className="mt-2 text-base font-bold text-white">{value}</p>
    </div>
  );
}

function ReportPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="avoid-break rounded-md border bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        {title.includes("Risk") ? (
          <ShieldCheck className="h-5 w-5 text-primary" />
        ) : title.includes("summary") ? (
          <FileText className="h-5 w-5 text-primary" />
        ) : (
          <ClipboardCheck className="h-5 w-5 text-primary" />
        )}
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="avoid-break rounded-md bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold capitalize text-slate-950">{value}</p>
    </div>
  );
}

function EvidenceCard({
  emptyText,
  records,
  title,
  tone
}: {
  emptyText: string;
  records: ReportSnapshot["topPositiveRecords"];
  title: string;
  tone: "positive" | "negative";
}) {
  return (
    <div className="avoid-break rounded-md border bg-white p-5">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      {records.length === 0 ? (
        <p className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {records.map((record) => (
            <div className="avoid-break rounded-md border bg-slate-50 p-4" key={record.id}>
              <div className="flex items-center justify-between gap-3">
                <span className={tone === "positive" ? "text-xs font-bold uppercase tracking-wide text-teal-700" : "text-xs font-bold uppercase tracking-wide text-red-700"}>
                  {record.sentiment}
                </span>
                <span className="text-xs font-bold text-slate-500">{Math.round(record.confidence * 100)}%</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{record.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function cleanRatio(snapshot: ReportSnapshot) {
  if (snapshot.datasetDetails.originalRecords === 0) {
    return 0;
  }

  return Math.round((snapshot.datasetDetails.cleanRecords / snapshot.datasetDetails.originalRecords) * 100);
}

function formatSource(sourceType: string) {
  return sourceType === "paste_text" ? "Paste Text" : "Upload CSV";
}

function topEntry(distribution: Record<string, number>) {
  const [label, count] = Object.entries(distribution).sort((a, b) => b[1] - a[1])[0] ?? ["neutral", 0];
  return `${label} (${count})`;
}
