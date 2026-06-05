"use client";

import { CalendarDays, CheckCircle2, ClipboardList, Lightbulb, Route } from "lucide-react";
import type { Recommendation, RecommendationPriority, RecommendationResult, RoadmapStep } from "@/types/recommendation";

interface RecommendationDashboardProps {
  result: RecommendationResult;
}

export function RecommendationDashboard({ result }: RecommendationDashboardProps) {
  return (
    <section className="mt-8 rounded-md border bg-white p-6">
      <div className="border-b pb-5">
        <p className="text-sm font-semibold text-primary">Phase 9</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">Recommendation Intelligence + Action Roadmap</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Recommendations are rule-based and evidence-driven. AI strategy generation will be added later.
        </p>
      </div>

      <div className="mt-6 rounded-md border bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-bold text-slate-950">Executive action summary</h3>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-700">{result.executiveActionSummary}</p>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold text-slate-950">Priority recommendations</h3>
        {result.recommendations.length === 0 ? (
          <p className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            No recommendation thresholds were triggered for this dataset.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {result.recommendations.map((recommendation) => (
              <RecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <RoadmapPanel icon={CalendarDays} steps={result.roadmap.sevenDay} title="7-day roadmap" />
        <RoadmapPanel icon={ClipboardList} steps={result.roadmap.thirtyDay} title="30-day roadmap" />
        <RoadmapPanel icon={Route} steps={result.roadmap.longTerm} title="Long-term improvement plan" />
      </div>
    </section>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <div className="rounded-md border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-slate-950">{recommendation.title}</h4>
          <p className="mt-1 text-sm font-semibold text-slate-500">{recommendation.category}</p>
        </div>
        <span className={getPriorityClassName(recommendation.priority)}>{recommendation.priority}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{recommendation.rationale}</p>
      <div className="mt-4 rounded-md bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Suggested action</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{recommendation.suggestedAction}</p>
      </div>
      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Evidence</p>
        <ul className="mt-2 space-y-2">
          {recommendation.evidence.map((item) => (
            <li className="flex gap-2 text-sm leading-6 text-slate-700" key={item}>
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RoadmapPanel({
  icon: Icon,
  steps,
  title
}: {
  icon: typeof CalendarDays;
  steps: RoadmapStep[];
  title: string;
}) {
  return (
    <div className="rounded-md border bg-white p-5">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
      </div>
      <div className="mt-4 space-y-3">
        {steps.map((step) => (
          <div className="rounded-md bg-slate-50 p-4" key={step.id}>
            <p className="font-bold text-slate-950">{step.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Linked recommendations: {step.linkedRecommendationIds.length}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getPriorityClassName(priority: RecommendationPriority) {
  if (priority === "high") {
    return "rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-red-700";
  }

  if (priority === "medium") {
    return "rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-800";
  }

  return "rounded-md bg-teal-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-teal-800";
}
