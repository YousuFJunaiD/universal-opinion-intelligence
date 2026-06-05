"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, Check, FileText, Globe2, Loader2, LinkIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectData } from "@/lib/data-services/project-data-service";
import { searchPublicSources } from "@/lib/api/client";
import {
  ORCHESTRATION_STEPS,
  runResearchToReportOrchestration
} from "@/lib/services/research-orchestration-service";
import { buildResearchPlan } from "@/lib/research/research-provider";
import { cn } from "@/lib/utils";
import {
  mapIntentToAnalysisType,
  type AnalysisIntent,
  type OrchestrationProgressStep,
  type PublicSearchResult,
  type ResearchDataSource,
  type ResearchExpectedOutput
} from "@/types/research";
import type { ProjectGoal } from "@/types/project";

const intents: Array<{ label: string; value: AnalysisIntent }> = [
  { label: "Topic", value: "topic" },
  { label: "Brand", value: "brand" },
  { label: "Product", value: "product" },
  { label: "Profile", value: "profile" },
  { label: "Public figure", value: "public-figure" },
  { label: "Campaign", value: "campaign" },
  { label: "Website", value: "website" },
  { label: "Custom dataset", value: "custom" }
];

const goals: ProjectGoal[] = [
  "Audience understanding",
  "Reputation",
  "Product improvement",
  "Crisis risk",
  "Growth",
  "Complaint detection"
];

const sources: Array<{ label: string; value: ResearchDataSource; icon: typeof Globe2 }> = [
  { label: "Public web research", value: "public-web", icon: Globe2 },
  { label: "URL", value: "url", icon: LinkIcon },
  { label: "Manual text", value: "manual-text", icon: FileText },
  { label: "CSV upload", value: "csv-upload", icon: Upload },
  { label: "Mixed", value: "mixed", icon: Bot }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [intent, setIntent] = useState<AnalysisIntent>("brand");
  const [goal, setGoal] = useState<ProjectGoal>("Audience understanding");
  const [dataSource, setDataSource] = useState<ResearchDataSource>("manual-text");
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("English");
  const [platform, setPlatform] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [expectedOutput, setExpectedOutput] = useState<ResearchExpectedOutput>("report-and-roadmap");
  const [manualText, setManualText] = useState("");
  const [urls, setUrls] = useState("");
  const [steps, setSteps] = useState(ORCHESTRATION_STEPS);
  const [limitations, setLimitations] = useState<string[]>([]);
  const [searchLimitations, setSearchLimitations] = useState<string[]>([]);
  const [discoveredSources, setDiscoveredSources] = useState<PublicSearchResult[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, "discovered" | "selected" | "extracting" | "skipped">>({});
  const [isSearching, setIsSearching] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");

  const plan = useMemo(
    () =>
      buildResearchPlan({
        dateRange,
        expectedOutput,
        intent,
        language,
        platform,
        region,
        subject: subject || "Untitled research topic",
        targetSources: [dataSource]
      }),
    [dataSource, dateRange, expectedOutput, intent, language, platform, region, subject]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLimitations([]);
    setSteps(ORCHESTRATION_STEPS);

    if (!subject.trim()) {
      setError("Describe what you want to analyse.");
      return;
    }

    if (dataSource === "csv-upload") {
      setIsRunning(true);
      try {
        const project = await createProjectData({
          name: subject.trim(),
          analysisType: mapIntentToAnalysisType(intent),
          dataSource: "Upload CSV",
          goal
        });
        router.push(`/dashboard/projects/${project.id}`);
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : "Failed to create project.");
        setIsRunning(false);
      }
      return;
    }

    setIsRunning(true);

    try {
      const selectedUrls = discoveredSources
        .filter((source) => selectedSourceIds.includes(source.id))
        .map((source) => source.url);
      const orchestrationUrls = [urls, selectedUrls.join("\n")].filter(Boolean).join("\n");

      if (selectedUrls.length) {
        setSourceStatuses((current) =>
          discoveredSources.reduce<Record<string, "discovered" | "selected" | "extracting" | "skipped">>((next, source) => {
            next[source.id] = selectedSourceIds.includes(source.id) ? "extracting" : "skipped";
            return next;
          }, { ...current })
        );
      }

      const result = await runResearchToReportOrchestration(
        {
          subject,
          intent,
          goal,
          dataSource,
          region,
          language,
          platform,
          dateRange,
          expectedOutput,
          manualText,
          urls: orchestrationUrls
        },
        updateStep
      );
      setLimitations(result.limitations);
      setSourceStatuses((current) =>
        Object.fromEntries(
          Object.entries(current).map(([id, status]) => [id, status === "extracting" ? "selected" : status])
        ) as Record<string, "discovered" | "selected" | "extracting" | "skipped">
      );
      router.push(`/dashboard/projects/${result.projectId}`);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Research orchestration failed.");
      setIsRunning(false);
    }
  }

  function updateStep(
    key: OrchestrationProgressStep["key"],
    status: OrchestrationProgressStep["status"]
  ) {
    setSteps((current) => current.map((step) => (step.key === key ? { ...step, status } : step)));
  }

  async function handleDiscoverSources() {
    setError("");
    setSearchLimitations([]);
    setIsSearching(true);

    try {
      const response = await searchPublicSources({
        dateRange,
        language,
        query: plan.query,
        region
      });
      setDiscoveredSources(response.results);
      setSelectedSourceIds(response.results.map((result) => result.id));
      setSearchLimitations(response.limitations);
      setSourceStatuses(
        Object.fromEntries(response.results.map((result) => [result.id, "selected"])) as Record<
          string,
          "discovered" | "selected" | "extracting" | "skipped"
        >
      );
      if (!response.configured) {
        setError(response.limitations[0] ?? "Search provider is not configured.");
      }
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Source discovery failed.");
    } finally {
      setIsSearching(false);
    }
  }

  function toggleSource(sourceId: string) {
    setSelectedSourceIds((current) => {
      const selected = current.includes(sourceId)
        ? current.filter((id) => id !== sourceId)
        : [...current, sourceId];
      setSourceStatuses((statuses) => ({
        ...statuses,
        [sourceId]: selected.includes(sourceId) ? "selected" : "skipped"
      }));
      return selected;
    });
  }

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-sm font-semibold text-primary">Conversational research copilot</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Research-to-report orchestration</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Describe the subject, choose the evidence source, and let the platform guide collection, analysis, reporting, and optional roadmap generation.
          </p>

          <Card className="mt-6 p-5">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div className="space-y-3 text-sm leading-6">
                <ChatBubble>What do you want to analyse?</ChatBubble>
                <ChatBubble>Is it a topic, brand, product, profile, public figure, campaign, website, or custom dataset?</ChatBubble>
                <ChatBubble>What evidence should be used: public web, URL, manual text, CSV, or mixed?</ChatBubble>
                <ChatBubble>Should the output be report only, or report plus guided roadmap?</ChatBubble>
              </div>
            </div>
          </Card>

          <Card className="mt-6 p-5">
            <h2 className="text-base font-bold text-slate-950">Research plan preview</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p><span className="font-bold">Query:</span> {plan.query}</p>
              <p><span className="font-bold">Region:</span> {plan.region}</p>
              <p><span className="font-bold">Language:</span> {plan.language}</p>
              <p><span className="font-bold">Date range:</span> {plan.dateRange}</p>
              <p><span className="font-bold">Output:</span> {plan.expectedOutput === "report-and-roadmap" ? "Report + action roadmap" : "Report only"}</p>
            </div>
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Public web search provider is not configured. Paste public URLs, manual text, or upload CSV. No hidden, private, login-protected, or CAPTCHA-protected content will be analysed.
            </div>
          </Card>
        </section>

        <Card className="p-5 md:p-6">
          <form className="space-y-7" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="subject">What do you want to analyse?</Label>
              <Input
                id="subject"
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Example: Audience response to Acme launch campaign"
                value={subject}
              />
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">Analysis intent</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {intents.map((item) => (
                  <OptionButton
                    active={intent === item.value}
                    key={item.value}
                    label={item.label}
                    onClick={() => setIntent(item.value)}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">Goal</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {goals.map((item) => (
                  <OptionButton active={goal === item} key={item} label={item} onClick={() => setGoal(item)} />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">Data source</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {sources.map((source) => (
                  <button
                    className={cn(
                      "flex min-h-24 flex-col items-start justify-between rounded-md border bg-white p-4 text-left transition hover:border-primary/50",
                      dataSource === source.value && "border-primary bg-blue-50"
                    )}
                    key={source.value}
                    onClick={() => setDataSource(source.value)}
                    type="button"
                  >
                    <source.icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-slate-900">{source.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input id="region" placeholder="India, US, Global" value={region} onChange={(event) => setRegion(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input id="language" value={language} onChange={(event) => setLanguage(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input id="platform" placeholder="Instagram, Amazon, Web" value={platform} onChange={(event) => setPlatform(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-range">Date range</Label>
              <Input id="date-range" placeholder="Last 30 days, May 2026, all available" value={dateRange} onChange={(event) => setDateRange(event.target.value)} />
            </div>

            {(dataSource === "manual-text" || dataSource === "mixed") ? (
              <div className="space-y-2">
                <Label htmlFor="manual-text">Manual text records</Label>
                <Textarea
                  id="manual-text"
                  placeholder="Paste one comment, review, caption, post, survey response, or public reaction per line."
                  value={manualText}
                  onChange={(event) => setManualText(event.target.value)}
                />
              </div>
            ) : null}

            {(dataSource === "url" || dataSource === "mixed") ? (
              <div className="space-y-2">
                <Label htmlFor="urls">Public URLs</Label>
                <Textarea
                  id="urls"
                  placeholder="Paste one or more public URLs. The system extracts title, meta description, readable text, and visible comment-like HTML only when present."
                  value={urls}
                  onChange={(event) => setUrls(event.target.value)}
                />
              </div>
            ) : null}

            {dataSource === "public-web" ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Public web research uses the configured search provider. If disabled, paste URLs, manual text, or upload CSV instead.
              </div>
            ) : null}

            {(dataSource === "public-web" || dataSource === "mixed") ? (
              <div className="rounded-md border bg-white p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-950">Public source discovery</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Fetches provider results only. Selected URLs are extracted later as public HTML.
                    </p>
                  </div>
                  <Button disabled={isSearching || !subject.trim()} onClick={handleDiscoverSources} variant="outline">
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
                    Discover sources
                  </Button>
                </div>

                {searchLimitations.length ? (
                  <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    {searchLimitations.slice(0, 3).map((limitation) => (
                      <p key={limitation}>{limitation}</p>
                    ))}
                  </div>
                ) : null}

                {discoveredSources.length ? (
                  <div className="mt-4 space-y-3">
                    {discoveredSources.map((source) => (
                      <label
                        className="flex cursor-pointer gap-3 rounded-md border bg-slate-50 p-3 hover:border-primary/50"
                        key={source.id}
                      >
                        <input
                          checked={selectedSourceIds.includes(source.id)}
                          className="mt-1 h-4 w-4"
                          onChange={() => toggleSource(source.id)}
                          type="checkbox"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-slate-950">{source.title}</span>
                          <span className="mt-1 block break-all text-xs font-semibold text-primary">{source.url}</span>
                          <span className="mt-1 block text-xs leading-5 text-slate-600">{source.snippet || "No snippet returned."}</span>
                          <span className="mt-2 inline-flex rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-600">
                            {sourceStatuses[source.id] ?? "discovered"}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {dataSource === "csv-upload" ? (
              <div className="rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                CSV upload continues on the project detail page so the existing column selector and preview flow remain unchanged.
              </div>
            ) : null}

            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">Do you want a guided roadmap for this field/topic?</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <OptionButton
                  active={expectedOutput === "report-only"}
                  label="Report only"
                  onClick={() => setExpectedOutput("report-only")}
                />
                <OptionButton
                  active={expectedOutput === "report-and-roadmap"}
                  label="Report + action roadmap"
                  onClick={() => setExpectedOutput("report-and-roadmap")}
                />
              </div>
            </fieldset>

            {error ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>
            ) : null}

            {limitations.length ? (
              <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-bold text-slate-900">Source limitations</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {limitations.slice(0, 5).map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <ProgressList steps={steps} />

            <Button className="h-11 w-full sm:w-auto" disabled={isRunning} type="submit">
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {dataSource === "csv-upload" ? "Create project for CSV upload" : "Generate report"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

function ChatBubble({ children }: { children: string }) {
  return <p className="rounded-md bg-slate-100 p-3 text-slate-700">{children}</p>;
}

function OptionButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex min-h-12 items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:border-primary/50",
        active && "border-primary bg-blue-50 text-primary"
      )}
      onClick={onClick}
      type="button"
    >
      {label}
      {active ? <Check className="h-4 w-4" /> : null}
    </button>
  );
}

function ProgressList({ steps }: { steps: OrchestrationProgressStep[] }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <p className="text-sm font-bold text-slate-950">Progress</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {steps.map((step) => (
          <div className="flex items-center gap-2 text-sm" key={step.key}>
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full bg-slate-300",
                step.status === "active" && "bg-blue-600",
                step.status === "complete" && "bg-emerald-600",
                step.status === "failed" && "bg-red-600"
              )}
            />
            <span className="font-semibold text-slate-700">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
