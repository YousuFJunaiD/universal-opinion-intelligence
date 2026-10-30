"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileText,
  Gauge,
  CheckCircle2,
  Loader2,
  Printer,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Upload
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SentimentLabel } from "@/types/analysis";
import { SHOWCASE_TITLE, SHOWCASE_MAX_INPUT_CHARS, SHOWCASE_MAX_RECORDS, showcaseUseCases, getShowcaseThemes, type ShowcaseUseCase } from "@/lib/services/showcase-config";
import { parseShowcaseInput, type ShowcaseInputRecord } from "@/lib/services/showcase-input-service";
import {
  flagReviewQuality,
  summarizeReviewQuality,
  type ReviewQualityFlag
} from "@/lib/services/review-quality-service";

const STORAGE_KEY = "college-phase-2-showcase-report-v1";
const PRESENTATION_STAGES = [
  "Preparing and validating input records",
  "Classifying positive, negative and neutral sentiment",
  "Checking generic, repeated and promotional-looking reviews",
  "Extracting domain themes and summarizing evidence",
  "Generating recommendations and preparing the saved report"
];
type PipelineProgress = { active: number; details: string[]; complete: boolean; elapsedMs?: number; paced: boolean };

function presentationPause(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Cancelled", "AbortError"));
    const abort = () => { window.clearTimeout(timer); reject(new DOMException("Cancelled", "AbortError")); };
    const timer = window.setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, 2000);
    signal.addEventListener("abort", abort, { once: true });
  });
}

type ShowcaseSourceType = ShowcaseUseCase | "topic" | "public_url" | "pasted_reviews" | "csv_dataset";

type ParsedRecord = ShowcaseInputRecord;

interface ShowcaseSentimentRecord extends ParsedRecord {
  sentiment: SentimentLabel;
  confidence: number;
  positiveKeywordMatches: string[];
  negativeKeywordMatches: string[];
}

interface ThemeCount {
  theme: string;
  count: number;
  sentiment: SentimentLabel | "mixed";
}

interface ShowcaseReport {
  id: string;
  title: string;
  sourceType: ShowcaseSourceType;
  sourceLabel: string;
  publicUrl?: string;
  createdAt: string;
  records: ShowcaseSentimentRecord[];
  qualityFlags: ReviewQualityFlag[];
  summary: {
    total: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
    suspiciousCount: number;
    suspiciousPercentage: number;
    highRiskQualityCount: number;
    mediumRiskQualityCount: number;
  };
  themes: ThemeCount[];
  recommendation: {
    category: string;
    rationale: string;
    suggestedAction: string;
  };
  engine: {
    name: string;
    version: string;
    fallbackNote: string;
  };
  limitations: string[];
}

const demoDatasets = [
  {
    description: "E-commerce reviews with detailed feedback, duplicates, and generic one-liners.",
    file: "demo_product_reviews.csv",
    label: "Product Reviews Demo",
    sourceType: "product" as const,
    title: "Wireless Gadget Purchase Review Check"
  },
  {
    description: "Synthetic public comments around a person or public topic.",
    file: "demo_public_figure_comments.csv",
    label: "Public Figure Comments Demo",
    sourceType: "public_figure" as const,
    title: "Public Figure / Topic Opinion Snapshot"
  },
  {
    description: "Brand and service feedback with support, delivery, app, and refund themes.",
    file: "demo_brand_feedback.csv",
    label: "Brand Feedback Demo",
    sourceType: "brand" as const,
    title: "Brand Feedback Showcase Report"
  }
];

const sourceTypes: Array<{ value: ShowcaseSourceType; label: string }> = [
  ...showcaseUseCases.map(({ value, label }) => ({ value, label })),
  { value: "topic", label: "Topic / public issue" },
  { value: "public_url", label: "Public URL text" },
  { value: "pasted_reviews", label: "Pasted reviews/comments" },
  { value: "csv_dataset", label: "CSV dataset" }
];

const boundedText = z.string().max(10_000);
const labelSchema = z.enum(["positive", "negative", "neutral"]);
const countSchema = z.number().int().min(0).max(SHOWCASE_MAX_RECORDS);
const percentSchema = z.number().min(0).max(100);
const savedReportSchema = z.object({
  id: boundedText, title: boundedText, sourceType: z.custom<ShowcaseSourceType>((value) => sourceTypes.some((item) => item.value === value)),
  sourceLabel: boundedText, publicUrl: boundedText.optional(), createdAt: z.string().refine((value) => Number.isFinite(Date.parse(value))),
  records: z.array(z.object({ id: boundedText, sourceRecordId: boundedText.optional(), text: boundedText, source: boundedText.optional(), sentiment: labelSchema, confidence: z.number().min(0).max(1), positiveKeywordMatches: z.array(boundedText), negativeKeywordMatches: z.array(boundedText) })).min(1).max(SHOWCASE_MAX_RECORDS),
  qualityFlags: z.array(z.object({ recordId: boundedText, isSuspicious: z.boolean(), riskLevel: z.enum(["low", "medium", "high"]), reasons: z.array(boundedText), evidence: z.array(boundedText), suggestedAction: boundedText, score: z.number().min(0).max(100) })).max(SHOWCASE_MAX_RECORDS),
  summary: z.object({ total: countSchema, positiveCount: countSchema, negativeCount: countSchema, neutralCount: countSchema, positivePercentage: percentSchema, negativePercentage: percentSchema, neutralPercentage: percentSchema, suspiciousCount: countSchema, suspiciousPercentage: percentSchema, highRiskQualityCount: countSchema, mediumRiskQualityCount: countSchema }),
  themes: z.array(z.object({ theme: boundedText, count: countSchema, sentiment: z.enum(["positive", "negative", "neutral", "mixed"]) })).max(20),
  recommendation: z.object({ category: boundedText, rationale: boundedText, suggestedAction: boundedText }),
  engine: z.object({ name: boundedText, version: boundedText, fallbackNote: boundedText }), limitations: z.array(boundedText)
}).refine((value) => {
  const ids = new Set(value.records.map((record) => record.id));
  return ids.size === value.records.length && value.summary.total === value.records.length &&
    value.summary.positiveCount + value.summary.negativeCount + value.summary.neutralCount === value.summary.total &&
    value.qualityFlags.length === value.records.length && new Set(value.qualityFlags.map((flag) => flag.recordId)).size === ids.size &&
    value.qualityFlags.every((flag) => ids.has(flag.recordId));
});

const positiveKeywords = [
  "good",
  "great",
  "amazing",
  "excellent",
  "love",
  "useful",
  "happy",
  "satisfied",
  "recommend",
  "best",
  "helpful",
  "clear",
  "fast",
  "polite",
  "smooth",
  "bright",
  "sharp",
  "fair",
  "solved",
  "on time",
  "worked",
  "positive",
  "respectful"
];

const negativeKeywords = [
  "bad",
  "worst",
  "poor",
  "hate",
  "disappointed",
  "useless",
  "angry",
  "problem",
  "issue",
  "slow",
  "broken",
  "late",
  "confusing",
  "refund",
  "failed",
  "damaged",
  "cheap",
  "noisy",
  "unclear",
  "delay",
  "complaint",
  "unsafe",
  "ignored",
  "hard",
  "stopped", "heating", "dirty", "rude", "unhelpful"
];

const themeLexicon = [
  { theme: "Battery and charging", terms: ["battery", "charging", "charger"] },
  { theme: "Display and camera", terms: ["screen", "display", "camera", "photo"] },
  { theme: "Delivery and packaging", terms: ["delivery", "packaging", "packing", "tracking"] },
  { theme: "Customer support", terms: ["support", "staff", "response", "email", "call"] },
  { theme: "Price and value", terms: ["price", "discount", "cost", "value"] },
  { theme: "Refund and warranty", terms: ["refund", "return", "warranty", "replacement"] },
  { theme: "App or website experience", terms: ["app", "website", "checkout", "payment", "filter", "search"] },
  { theme: "Policy or public plan", terms: ["policy", "plan", "proposal", "funding", "transport", "education"] },
  { theme: "Trust and reliability", terms: ["trust", "promise", "reliable", "safe", "clear"] }
];

const limitations = [
  "Suspicious/generic review flagging is heuristic and does not confirm fake reviews.",
  "No account metadata, verified purchase metadata, reviewer history, or order metadata is used.",
  "Sentiment may be wrong for sarcasm, mixed language, very short text, or context-heavy comments.",
  "The public URL is context only in this showcase; no page or platform is fetched for analysis.",
  "Rule scores are uncalibrated heuristics, not probabilities of correctness. Neutral also includes ties and text without recognized cues.",
  "Keyword groups count mentions, not validated aspect-level sentiment. Duplicate records remain in sentiment totals.",
  "Unflagged does not mean verified. Review-priority bands are not product or person trust scores.",
  "The latest snapshot is stored only in this browser and may be lost if browser data is cleared. Export a copy.",
  "This report supports human review; do not use it alone for purchase, governance, clinical, or other high-impact decisions."
];

const starterText = `Battery lasts the full day, the screen is bright, and delivery was on time.
Good product
The camera quality is sharp in daylight, but the night photos are noisy.
Worst
The charger stopped working after two weeks and support asked me to wait again.
Battery lasts the full day, the screen is bright, and delivery was on time.`;

export default function ShowcasePage() {
  const [title, setTitle] = useState("Wireless Gadget Purchase Review Check");
  const [sourceType, setSourceType] = useState<ShowcaseSourceType>("product");
  const [publicUrl, setPublicUrl] = useState("");
  const [inputText, setInputText] = useState(starterText);
  const [status, setStatus] = useState("Ready. Use pasted text, upload CSV, or select a demo dataset.");
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<ShowcaseReport | null>(null);
  const [csvInput, setCsvInput] = useState(false);
  const [presentationMode, setPresentationMode] = useState(true);
  const [pipeline, setPipeline] = useState<PipelineProgress | null>(null);
  const operationId = useRef(0);
  const activeRun = useRef<AbortController | null>(null);
  const activeFetch = useRef<AbortController | null>(null);
  const activeReader = useRef<FileReader | null>(null);

  useEffect(() => {
    try {
      const savedReport = window.localStorage.getItem(STORAGE_KEY);
      if (!savedReport) return;
      if (savedReport.length > 5_000_000) throw new Error("Saved snapshot too large");
      const validated = savedReportSchema.safeParse(JSON.parse(savedReport));
      if (!validated.success) throw new Error("Invalid saved snapshot");
      const parsed = validated.data;
      setReport(parsed);
      setTitle(parsed.title);
      setSourceType(parsed.sourceType);
      setPublicUrl(parsed.publicUrl ?? "");
      // Restore input too, so rerunning cannot silently analyse unrelated starter text.
      setInputText(["id,text,source", ...parsed.records.map((record) => [record.sourceRecordId ?? record.id, record.text, record.source ?? "restored"].map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n"));
      setCsvInput(true);
      setStatus("Loaded latest saved showcase report and its input from this browser.");
    } catch {
      setStatus("Saved report could not be restored. Load a demo or paste text; analysis is still available.");
    }
  }, []);

  useEffect(() => () => {
    operationId.current += 1;
    activeRun.current?.abort();
    activeFetch.current?.abort();
    activeReader.current?.abort();
  }, []);

  const suspiciousExamples = useMemo(() => {
    if (!report) {
      return [];
    }

    return report.qualityFlags
      .filter((flag) => flag.isSuspicious)
      .map((flag) => ({
        flag,
        record: report.records.find((record) => record.id === flag.recordId)
      }))
      .filter((item) => item.record)
      .slice(0, 5);
  }, [report]);

  function invalidateOperation() {
    operationId.current += 1;
    activeRun.current?.abort(); activeRun.current = null;
    activeFetch.current?.abort(); activeFetch.current = null;
    activeReader.current?.abort(); activeReader.current = null;
    setIsRunning(false);
    setPipeline(null);
    if (isRunning) setStatus("Analysis cancelled. Input changed; run again when ready. The previous completed report is unchanged.");
    return operationId.current;
  }

  async function runShowcaseAnalysis() {
    // The ref closes the repeat-click window before React renders disabled=true.
    if (activeRun.current) return;
    const currentOperation = invalidateOperation();
    const started = performance.now();
    let parsedRecords: ParsedRecord[];
    try {
      parsedRecords = parseShowcaseInput(inputText, csvInput);
      if (!parsedRecords.length) throw new Error("No usable text found. Paste reviews/comments or select a demo dataset.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Input could not be validated.");
      return;
    }
    const controller = new AbortController();
    activeRun.current = controller;
    const details: string[] = [];
    const stage = async (index: number, detail: string) => {
      if (controller.signal.aborted || currentOperation !== operationId.current) throw new DOMException("Cancelled", "AbortError");
      details[index] = detail;
      setPipeline({ active: index, details: [...details], complete: false, paced: presentationMode });
      setStatus(`${PRESENTATION_STAGES[index]}. ${detail}`);
      if (presentationMode) await presentationPause(controller.signal);
      if (controller.signal.aborted || currentOperation !== operationId.current) throw new DOMException("Cancelled", "AbortError");
    };
    setIsRunning(true);
    try {
      await stage(0, `${parsedRecords.length} valid records; duplicates retained as independent evidence.`);
      const sentimentRecords = parsedRecords.map(classifyRecord);
      const labelCount = (label: SentimentLabel) => sentimentRecords.filter(record => record.sentiment === label).length;
      await stage(1, `${labelCount("positive")} positive · ${labelCount("negative")} negative · ${labelCount("neutral")} neutral/tied. Local rules, not RoBERTa.`);
      const qualityFlags = flagReviewQuality(sentimentRecords);
      const qualitySummary = summarizeReviewQuality(qualityFlags);
      await stage(2, `${qualitySummary.suspiciousCount} records flagged for human review. Flags do not confirm deception.`);
      const summary = buildSummary(sentimentRecords, qualitySummary);
      const themes = extractThemes(sentimentRecords, sourceType);
      await stage(3, `${themes.length} repeated keyword groups; ${sentimentRecords.length} evidence rows summarized. Groups are lexical matches, not topic models.`);
      const nextReport: ShowcaseReport = {
        id: createId("showcase-report"),
        title: title.trim() || "College Phase-II Opinion Intelligence Showcase",
        sourceType,
        sourceLabel: getSourceTypeLabel(sourceType),
        publicUrl: publicUrl.trim() || undefined,
        createdAt: new Date().toISOString(),
        records: sentimentRecords,
        qualityFlags,
        summary,
        themes,
        recommendation: buildRecommendation(summary, qualitySummary, sentimentRecords.length),
        engine: {
          name: "browser-rule-based-showcase",
          version: "1.1.0",
          fallbackNote:
            "Showcase mode uses local deterministic rules so the demo works without Supabase, FastAPI, search APIs, or internet access."
        },
        limitations
      };

      await stage(4, `Recommendation and ${nextReport.records.length}-record report prepared; browser storage will be attempted at completion.`);
      nextReport.createdAt = new Date().toISOString();
      setReport(nextReport);
      setPipeline({ active: 4, details: [...details.slice(0, 4), `${nextReport.records.length}-record report ready. Engine: browser-rule-based-showcase.`], complete: true, elapsedMs: performance.now() - started, paced: presentationMode });
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextReport));
        setStatus(`Analysis complete. Saved ${nextReport.records.length} records and report snapshot in browser localStorage.`);
      } catch {
        setStatus("Analysis complete, but browser storage is unavailable or full. Download or print this report now; it is not saved.");
      }
    } catch (error) {
      if (controller.signal.aborted || currentOperation !== operationId.current) return;
        setStatus(error instanceof Error ? error.message : "Analysis failed. Try a smaller input.");
      setPipeline(null);
    } finally {
      if (currentOperation === operationId.current) { activeRun.current = null; setIsRunning(false); }
    }
  }

  async function loadDemoDataset(file: string, nextTitle: string, nextSourceType: ShowcaseSourceType) {
    const currentOperation = invalidateOperation();
    const controller = new AbortController();
    activeFetch.current = controller;
    setStatus(`Loading ${file}...`);
    try {
    const response = await fetch(`/demo-data/${file}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) });
    if (!response.ok) {
      if (currentOperation === operationId.current) setStatus(`Could not load ${file}. Use pasted text fallback.`);
      return;
    }

    const text = await response.text();
    if (currentOperation !== operationId.current) return;
    parseShowcaseInput(text, true);
    setInputText(text);
    setCsvInput(true);
    setTitle(nextTitle);
    setSourceType(nextSourceType);
    setPublicUrl("");
    setStatus(`Loaded ${file}. Click Run Analysis to generate a fresh report.`);
    } catch {
      if (currentOperation === operationId.current) setStatus(`Could not load ${file}. Paste text or upload a local CSV instead.`);
    }
  }

  function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const currentOperation = invalidateOperation();
    if (file.size > SHOWCASE_MAX_INPUT_CHARS) {
      setStatus("CSV is too large for the showcase. Use a file under 250 KB and at most 250 records.");
      return;
    }
    const reader = new FileReader();
    activeReader.current = reader;
    setStatus(`Reading ${file.name}...`);
    reader.onload = () => {
      if (currentOperation !== operationId.current) return;
      const text = String(reader.result ?? "");
      try { parseShowcaseInput(text, true); } catch (error) {
        setStatus(error instanceof Error ? error.message : "CSV could not be parsed.");
        return;
      }
      setInputText(text);
      setCsvInput(true);
      setPublicUrl("");
      setTitle(file.name.replace(/\.csv$/i, "") || "Uploaded CSV Showcase Report");
      setStatus(`Loaded ${file.name}. Click Run Analysis to process the uploaded CSV.`);
    };
    reader.onerror = () => { if (currentOperation === operationId.current) setStatus("CSV could not be read. Paste its text instead."); };
    reader.readAsText(file);
  }

  function resetDemo() {
    invalidateOperation();
    let cleared = true;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { cleared = false; }
    setReport(null);
    setTitle("Wireless Gadget Purchase Review Check");
    setSourceType("product");
    setPublicUrl("");
    setInputText(starterText);
    setCsvInput(false);
    setStatus(cleared ? "Demo reset. Starter pasted reviews are ready." : "View reset, but saved data could not be cleared. Clear site storage in browser settings if needed.");
  }

  function downloadReport() {
    if (!report) {
      return;
    }

    const blob = new Blob([buildMarkdownReport(report)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(report.title) || "opinion"}-showcase-report.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="no-print border-b bg-white/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <BrandMark />
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="no-print border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="inline-flex items-center gap-2 rounded-md border bg-blue-50 px-3 py-1 text-sm font-bold text-blue-800">
            <Sparkles className="h-4 w-4" />
            Final College Phase-II Showcase Demo
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            {SHOWCASE_TITLE}
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600">
            Paste reviews/comments, upload a CSV, or load a synthetic demo dataset. The page runs local sentiment analysis,
            suspicious/generic review flagging, evidence-based suggestions, and a print-ready report without requiring Supabase,
            FastAPI, search APIs, or internet access.
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            This system supports multi-domain opinion analysis, not only e-commerce. “Trust analysis” means inspecting
            text quality and supporting evidence; it does not verify a person, product, or review.
          </p>
          <div aria-label="Use case selection" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {showcaseUseCases.slice(0, 6).map((useCase) => (
              <button aria-pressed={sourceType === useCase.value} className={`rounded-md border p-4 text-left ${sourceType === useCase.value ? "border-blue-700 bg-blue-50" : "bg-white"}`} key={useCase.value} type="button" onClick={() => {
                invalidateOperation();
                setSourceType(useCase.value);
                setTitle(`${useCase.label} Opinion Report`);
                setStatus(`Selected ${useCase.label}. Existing text is unchanged; add relevant feedback, then run analysis.`);
              }}>
                <span className="block font-bold">{useCase.label}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{useCase.description}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Analysis pipeline" className="no-print mx-auto max-w-7xl px-6 pt-7">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">From supplied text to reviewable evidence</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Engine: <strong>browser-rule-based-showcase</strong>. Deterministic browser rules; no cloud inference or RoBERTa. Flags request human review; rule scores are not calibrated probabilities.</p>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-slate-50 px-4 py-3 text-sm font-semibold">
              <input type="checkbox" checked={presentationMode} onChange={event => {
                invalidateOperation(); setPresentationMode(event.target.checked);
                setStatus(event.target.checked ? "Presentation Mode enabled. About 10 seconds of labelled pacing; algorithms are unchanged." : "Fast Mode enabled. Same algorithms with no deliberate pacing.");
              }} />
              Presentation Mode
            </label>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">{presentationMode ? "Presentation Mode: about 10 seconds of intentional stage pacing, not measured compute time. Changing input cancels the pending run." : "Fast Mode: no presentation delays. The same validation, sentiment, quality and reporting algorithms run locally."}</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {PRESENTATION_STAGES.map((name, index) => {
              const done = !!pipeline && (pipeline.complete || index < pipeline.active);
              const active = !!pipeline && !pipeline.complete && index === pipeline.active;
              return <li key={name} data-testid={`pipeline-stage-${index}`} data-state={done ? "complete" : active ? "active" : "pending"} aria-current={active ? "step" : undefined} className={`rounded-lg border p-3 transition-colors motion-reduce:transition-none ${active ? "border-blue-600 bg-blue-50" : done ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                  {done ? <CheckCircle2 className="h-4 w-4 text-teal-700" aria-hidden="true" /> : active ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none text-blue-700" aria-hidden="true" /> : <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-200">{index + 1}</span>}
                  {done ? "Complete" : active ? "Current stage" : "Pending"}
                </div>
                <h3 className="mt-2 text-sm font-semibold leading-5">{name}</h3>
                {pipeline?.details[index] && <p className="mt-2 text-xs leading-5 text-slate-600">{pipeline.details[index]}</p>}
              </li>;
            })}
          </ol>
          {pipeline?.complete && <p data-testid="pipeline-complete" className="mt-4 rounded-lg bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900">Report complete · {((pipeline.elapsedMs ?? 0) / 1000).toFixed(2)} s elapsed{pipeline.paced ? " including intentional presentation pacing" : " in Fast Mode"}. Actual engine: browser-rule-based-showcase. Inspect the evidence below.</p>}
          {isRunning && <Button variant="outline" className="mt-4" onClick={() => { invalidateOperation(); setStatus("Analysis cancelled. The previous completed report is unchanged."); }}>Cancel analysis</Button>}
        </div>
      </section>

      <section className="no-print mx-auto grid max-w-7xl gap-6 px-6 py-8 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary">Input</p>
              <h2 className="mt-1 text-2xl font-bold">Create a showcase run</h2>
            </div>
            <Gauge className="h-6 w-6 text-primary" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">Report title / topic</span>
              <input
                className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                onChange={(event) => { invalidateOperation(); setTitle(event.target.value); }}
                value={title}
                maxLength={200}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">Use case / source context</span>
              <select
                className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                onChange={(event) => { invalidateOperation(); setSourceType(event.target.value as ShowcaseSourceType); }}
                value={sourceType}
              >
                {sourceTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-sm font-bold text-slate-700">Public URL, optional</span>
            <input
              className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => { invalidateOperation(); setPublicUrl(event.target.value); }}
              placeholder="Source context only — paste the actual text below."
              value={publicUrl}
              maxLength={2000}
            />
            <span className="block text-xs font-semibold text-slate-500">
              This field does not fetch content. Analyze only text you are authorized to use; omit patient, student, and customer identifiers.
            </span>
          </label>

          <div className="mt-5">
            <p className="text-sm font-bold text-slate-700">Synthetic demo datasets</p>
            <div className="mt-3 grid gap-3">
              {demoDatasets.map((dataset) => (
                <button
                  className="rounded-md border bg-slate-50 p-4 text-left transition hover:border-primary hover:bg-blue-50"
                  key={dataset.file}
                  onClick={() => loadDemoDataset(dataset.file, dataset.title, dataset.sourceType)}
                  type="button"
                >
                  <span className="block text-sm font-bold text-slate-950">{dataset.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{dataset.description}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="mt-5 block space-y-2">
            <span className="text-sm font-bold text-slate-700">Pasted reviews/comments or CSV text</span>
            <textarea
              className="min-h-64 w-full rounded-md border bg-white px-3 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => { invalidateOperation(); setInputText(event.target.value); setCsvInput(false); }}
              value={inputText}
              maxLength={SHOWCASE_MAX_INPUT_CHARS}
            />
            <span className="block text-xs text-slate-600">One record per line, or CSV with a text/review/comment/content/feedback/feedback_text header. College CSV response_id values are retained; manual labels, categories, and notes are not used for inference. Maximum 250 records, 5,000 characters per record. Empty rows are skipped; duplicates are retained and flagged. Keyword groups need two mentions.</span>
          </label>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              Upload CSV
              <input accept=".csv,text/csv" className="sr-only" onChange={handleCsvUpload} type="file" />
            </label>
            <Button disabled={isRunning} onClick={runShowcaseAnalysis}>
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Run Analysis
            </Button>
            <Button onClick={resetDemo} variant="outline">
              <RefreshCw className="h-4 w-4" />
              Reset Demo
            </Button>
          </div>

          <p role="status" aria-live="polite" className="mt-4 rounded-md bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{status}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary">Output</p>
              <h2 className="mt-1 text-2xl font-bold">Showcase dashboard</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A completed snapshot stays visible until the next successful run. Check the report title and engine below; saving depends on browser storage availability.
              </p>
            </div>
            <FileText className="h-6 w-6 text-primary" />
          </div>

          {report ? (
            <div key={report.id} className="mt-5 space-y-5" data-testid="completed-report" aria-busy={isRunning}>
              <p className={`rounded-lg border px-3 py-2 text-sm font-semibold ${isRunning ? "border-amber-200 bg-amber-50 text-amber-900" : "border-teal-200 bg-teal-50 text-teal-900"}`}>{isRunning ? "Previous completed snapshot — pending analysis has not replaced this report." : "Completed snapshot · browser-rule-based-showcase · local deterministic inference"}</p>
              <p className="text-sm font-semibold text-slate-600">Snapshot: {report.title} · {report.sourceLabel}</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Records" value={report.summary.total} />
                <Metric label="Positive" percentage={report.summary.positivePercentage} tone="positive" value={report.summary.positiveCount} />
                <Metric label="Negative" percentage={report.summary.negativePercentage} tone="negative" value={report.summary.negativeCount} />
                <Metric label="Neutral / tied" percentage={report.summary.neutralPercentage} value={report.summary.neutralCount} />
                <Metric label="Suspicious/generic" percentage={report.summary.suspiciousPercentage} tone="warning" value={report.summary.suspiciousCount} />
              </div>

              <div className="rounded-md border bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-950">{report.recommendation.category}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{report.recommendation.rationale}</p>
                <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  Suggested action: {report.recommendation.suggestedAction}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <EvidenceCard records={report.records.filter((record) => record.sentiment === "positive").slice(0, 3)} title="Positive evidence" />
                <EvidenceCard records={report.records.filter((record) => record.sentiment === "negative").slice(0, 3)} title="Negative evidence" />
              </div>

              <div className="rounded-md border bg-white p-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold">Suspicious/generic review flags</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">Flagged for manual review, not confirmed fake. Review priority is a text-quality heuristic.</p>
                {suspiciousExamples.length ? (
                  <div className="mt-4 space-y-3">
                    {suspiciousExamples.map(({ flag, record }) => (
                      <div className="rounded-md border bg-amber-50 p-3" key={flag.recordId}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
                            {flag.riskLevel} review priority · {flag.reasons.join(", ")}
                          </span>
                          <span className="text-xs font-bold text-slate-500">Needs manual review</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-800">{record?.text}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-600">Why flagged? {flag.evidence.join(" ")}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                    No suspicious/generic review pattern crossed the heuristic threshold.
                  </p>
                )}
              </div>

              <div className="rounded-md border bg-white p-4">
                <h3 className="font-bold">Repeated themes / keyword groups</h3>
                {report.themes.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.themes.map((theme) => (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700" key={theme.theme}>
                        {theme.theme}: {theme.count}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-slate-500">No repeated concrete theme crossed the display threshold.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print / Save PDF
                </Button>
                <Button onClick={downloadReport} variant="outline">
                  <Download className="h-4 w-4" />
                  Download Markdown
                </Button>
                <Button variant="outline" onClick={() => {
                  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${slugify(report.title)}-evaluation.json`;
                  link.click();
                  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}>
                  <Download className="h-4 w-4" />
                  Download Evaluation JSON
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-md border border-dashed bg-slate-50 p-8 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" />
              <p className="mt-3 text-base font-bold text-slate-950">No report generated yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Load the product reviews demo first, then click Run Analysis for the quickest final showcase flow.
              </p>
            </div>
          )}
        </Card>
      </section>

      {report ? <PrintableReport report={report} /> : null}
    </main>
  );
}

function Metric({
  label,
  percentage,
  tone = "neutral",
  value
}: {
  label: string;
  percentage?: number;
  tone?: "positive" | "negative" | "warning" | "neutral";
  value: number;
}) {
  return (
    <div className="rounded-md border bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      {percentage !== undefined ? (
        <div className="mt-3">
          <div className="h-2 rounded-full bg-slate-100">
            <div className={getBarClassName(tone)} style={{ width: `${percentage}%` }} />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500">{percentage}%</p>
        </div>
      ) : null}
    </div>
  );
}

function EvidenceCard({ records, title }: { records: ShowcaseSentimentRecord[]; title: string }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <h3 className="font-bold text-slate-950">{title}</h3>
      {records.length ? (
        <div className="mt-3 space-y-3">
          {records.map((record) => (
            <div className="rounded-md bg-slate-50 p-3" key={record.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{record.sentiment}</span>
                <span className="text-xs font-bold text-slate-500">Rule score {Math.round(record.confidence * 100)}% (uncalibrated)</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{record.text}</p>
              <p className="mt-2 text-xs text-slate-500">Record {record.id} · Positive cues: {record.positiveKeywordMatches.join(", ") || "none"} · Negative cues: {record.negativeKeywordMatches.join(", ") || "none"}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold text-slate-500">No records in this sentiment group.</p>
      )}
    </div>
  );
}

function PrintableReport({ report }: { report: ShowcaseReport }) {
  const suspiciousRows = report.qualityFlags
    .filter((flag) => flag.isSuspicious)
    .map((flag) => ({
      flag,
      record: report.records.find((record) => record.id === flag.recordId)
    }))
    .filter((item) => item.record)
    .slice(0, 8);

  return (
    <section className="printable-report mx-auto mb-12 max-w-5xl px-6">
      <div className="rounded-lg border bg-white p-8 shadow-soft" id="printable-report">
        <div className="border-b pb-6">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">College Phase-II Final Showcase Report</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">{report.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Use case: {report.sourceLabel} · Records analysed: {report.summary.total} · Generated:{" "}
            {new Date(report.createdAt).toLocaleString()}
          </p>
          {report.publicUrl ? <p className="mt-1 text-sm font-semibold text-slate-600">Source URL/context: {report.publicUrl}</p> : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric label="Positive" percentage={report.summary.positivePercentage} tone="positive" value={report.summary.positiveCount} />
          <Metric label="Negative" percentage={report.summary.negativePercentage} tone="negative" value={report.summary.negativeCount} />
          <Metric label="Neutral" percentage={report.summary.neutralPercentage} value={report.summary.neutralCount} />
          <Metric label="Generic flags" percentage={report.summary.suspiciousPercentage} tone="warning" value={report.summary.suspiciousCount} />
        </div>

        <div className="report-section avoid-break mt-6 rounded-md border bg-slate-50 p-5">
          <h3 className="text-lg font-bold">Final recommendation</h3>
          <p className="mt-2 font-semibold text-slate-800">{report.recommendation.category}</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{report.recommendation.rationale}</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">Suggested action: {report.recommendation.suggestedAction}</p>
        </div>

        <div className="report-section mt-6 grid gap-5 md:grid-cols-2">
          <ReportList
            items={report.records.filter((record) => record.sentiment === "positive").slice(0, 5).map((record) => record.text)}
            title="Positive evidence (first five in input order)"
          />
          <ReportList
            items={report.records.filter((record) => record.sentiment === "negative").slice(0, 5).map((record) => record.text)}
            title="Negative evidence (first five in input order)"
          />
        </div>

        <ReportList
          className="report-section mt-6"
          items={report.records.filter((record) => record.sentiment === "neutral").slice(0, 4).map((record) => record.text)}
          title="Neutral or mixed examples"
        />

        <div className="report-section mt-6 rounded-md border p-5">
          <h3 className="text-lg font-bold">Suspicious/generic review examples</h3>
          <p className="mt-2 text-sm text-slate-600">Flagged for manual review, not confirmed fake. Bands indicate review priority. Examples are shown in input order.</p>
          {suspiciousRows.length ? (
            <div className="mt-3 space-y-3">
              {suspiciousRows.map(({ flag, record }) => (
                <div className="avoid-break rounded-md bg-amber-50 p-3" key={flag.recordId}>
                  <p className="text-sm font-bold text-amber-900">{flag.riskLevel} review priority · {flag.reasons.join(", ")}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-800">{record?.text}</p>
                  <p className="mt-1 text-xs text-slate-600">Why flagged? {flag.evidence.join(" ")}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{flag.suggestedAction}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-600">No suspicious/generic review pattern crossed the threshold.</p>
          )}
        </div>

        <ReportList className="report-section mt-6" items={report.themes.map((theme) => `${theme.theme}: ${theme.count} records`)} title="Repeated keyword groups (mentions, not aspect sentiment)" />

        <div className="report-section avoid-break mt-6 rounded-md border p-5">
          <h3 className="text-lg font-bold">Model and engine metadata</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Engine: {report.engine.name} v{report.engine.version}. {report.engine.fallbackNote}
          </p>
        </div>

        <ReportList className="report-section mt-6" items={report.limitations} title="Limitations and human-review boundary" />
      </div>
    </section>
  );
}

function ReportList({ className = "", items, title }: { className?: string; items: string[]; title: string }) {
  return (
    <div className={`avoid-break rounded-md border p-5 ${className}`}>
      <h3 className="text-lg font-bold">{title}</h3>
      {items.length ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm font-semibold text-slate-500">No examples available in this group.</p>
      )}
    </div>
  );
}


function classifyRecord(record: ParsedRecord): ShowcaseSentimentRecord {
  // Limited local negation: only the preceding three words in the same clause.
  // This is a presentation safeguard, not a context-aware NLP model.
  const positiveKeywordMatches: string[] = [];
  const negativeKeywordMatches: string[] = [];
  for (const [keywords, positive] of [[positiveKeywords, true], [negativeKeywords, false]] as const) {
    for (const keyword of keywords) {
      for (const match of record.text.matchAll(new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "gi"))) {
        const prefix = record.text.slice(0, match.index).split(/[.!?,;:\n]/).pop() ?? "";
        const preceding = prefix.toLowerCase().trim().split(/\s+/).slice(-3).join(" ");
        const negated = /\b(not|never|no|isn't|wasn't|don't|doesn't|didn't|cannot|can't)\b/.test(preceding) && !/\bnot only\b/.test(preceding);
        const target = positive !== negated ? positiveKeywordMatches : negativeKeywordMatches;
        const cue = `${negated ? "negated: " : ""}${keyword}`;
        if (!target.includes(cue)) target.push(cue);
      }
    }
  }
  const sentiment = classifySentiment(positiveKeywordMatches.length, negativeKeywordMatches.length);
  const confidence = calculateConfidence(positiveKeywordMatches.length, negativeKeywordMatches.length, sentiment);

  return {
    ...record,
    sentiment,
    confidence,
    positiveKeywordMatches,
    negativeKeywordMatches
  };
}

function classifySentiment(positiveMatches: number, negativeMatches: number): SentimentLabel {
  if (positiveMatches > negativeMatches) {
    return "positive";
  }

  if (negativeMatches > positiveMatches) {
    return "negative";
  }

  return "neutral";
}

function calculateConfidence(positiveMatches: number, negativeMatches: number, sentiment: SentimentLabel) {
  const totalMatches = positiveMatches + negativeMatches;
  if (sentiment === "neutral") {
    return totalMatches === 0 ? 0.52 : 0.6;
  }

  const margin = Math.abs(positiveMatches - negativeMatches);
  return Math.min(0.95, Number((0.58 + margin * 0.12 + totalMatches * 0.035).toFixed(2)));
}

function buildSummary(records: ShowcaseSentimentRecord[], qualitySummary: ReturnType<typeof summarizeReviewQuality>) {
  const total = records.length;
  const positiveCount = records.filter((record) => record.sentiment === "positive").length;
  const negativeCount = records.filter((record) => record.sentiment === "negative").length;
  const neutralCount = records.filter((record) => record.sentiment === "neutral").length;

  return {
    total,
    positiveCount,
    negativeCount,
    neutralCount,
    positivePercentage: toPercentage(positiveCount, total),
    negativePercentage: toPercentage(negativeCount, total),
    neutralPercentage: toPercentage(neutralCount, total),
    suspiciousCount: qualitySummary.suspiciousCount,
    suspiciousPercentage: qualitySummary.suspiciousPercentage,
    highRiskQualityCount: qualitySummary.highRiskCount,
    mediumRiskQualityCount: qualitySummary.mediumRiskCount
  };
}

function extractThemes(records: ShowcaseSentimentRecord[], sourceType: ShowcaseSourceType): ThemeCount[] {
  const domainThemes = getShowcaseThemes(sourceType);
  return (domainThemes.length ? domainThemes : themeLexicon)
    .map((theme) => {
      const matchingRecords = records.filter((record) =>
        theme.terms.some((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(record.text))
      );
      const positive = matchingRecords.filter((record) => record.sentiment === "positive").length;
      const negative = matchingRecords.filter((record) => record.sentiment === "negative").length;
      const sentiment: ThemeCount["sentiment"] = positive > negative ? "positive" : negative > positive ? "negative" : "mixed";

      return {
        theme: theme.theme,
        count: matchingRecords.length,
        sentiment
      };
    })
    .filter((theme) => theme.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function buildRecommendation(
  summary: ShowcaseReport["summary"],
  qualitySummary: ReturnType<typeof summarizeReviewQuality>,
  totalRecords: number
) {
  const unflaggedRecords = Math.max(totalRecords - qualitySummary.suspiciousCount, 0);

  if (totalRecords < 5 || unflaggedRecords < 3) {
    return {
      category: "Too little reliable evidence",
      rationale:
        "The dataset has fewer than five records or fewer than three unflagged records. Unflagged records are not verified evidence; more context is needed.",
      suggestedAction: "Collect more detailed reviews/comments and compare them with the current report before making a decision."
    };
  }

  if (summary.suspiciousPercentage >= 40) {
    return {
      category: "Many generic reviews detected",
      rationale:
        "A large share of records were flagged as potentially generic, repeated, promotional-looking, or low-detail. Sentiment totals should be interpreted carefully.",
      suggestedAction: "Prioritize detailed records with concrete product/service evidence and manually verify repeated or generic text."
    };
  }

  if (summary.negativePercentage >= 45) {
    return {
      category: "High complaint concentration",
      rationale:
        "At least 45% of supplied records were labelled negative by local rules. Inspect those records before drawing conclusions about the subject.",
      suggestedAction: "Inspect negative evidence, check repeated issues, and look for independent confirmation from detailed reviews."
    };
  }

  if (summary.positivePercentage >= 60 && summary.negativePercentage < 25) {
    return {
      category: "Strong positive signal",
      rationale:
        "Positive sentiment is the largest signal and complaint concentration is comparatively low in the analysed records.",
      suggestedAction: "Use the result as a positive indicator, but still review flagged generic records and confirm important details manually."
    };
  }

  return {
    category: "Mixed response / needs manual verification",
    rationale:
      "No strong positive or high-complaint threshold was met. Neutral labels may reflect missing cues or tied evidence, so manual inspection is needed.",
    suggestedAction: "Compare positive and negative evidence, then collect more records if the decision depends on trust, safety, or purchase risk."
  };
}

function getSourceTypeLabel(sourceType: ShowcaseSourceType) {
  return sourceTypes.find((item) => item.value === sourceType)?.label ?? "Custom text";
}

function getBarClassName(tone: "positive" | "negative" | "warning" | "neutral") {
  if (tone === "positive") {
    return "h-2 rounded-full bg-teal-600";
  }

  if (tone === "negative") {
    return "h-2 rounded-full bg-red-600";
  }

  if (tone === "warning") {
    return "h-2 rounded-full bg-amber-500";
  }

  return "h-2 rounded-full bg-slate-500";
}

function buildMarkdownReport(report: ShowcaseReport) {
  const flagged = report.qualityFlags.filter((flag) => flag.isSuspicious);
  return `# ${escapeMarkdown(report.title)}

Report ID: ${escapeMarkdown(report.id)}
Generated: ${report.createdAt}

Use case: ${escapeMarkdown(report.sourceLabel)}
${report.publicUrl ? `Source URL/context (not fetched): ${escapeMarkdown(report.publicUrl)}\n` : ""}
Engine: ${report.engine.name} v${report.engine.version}
${report.engine.fallbackNote}

## Sentiment Summary

- Records analysed: ${report.summary.total}
- Positive: ${report.summary.positiveCount} (${report.summary.positivePercentage}%)
- Negative: ${report.summary.negativeCount} (${report.summary.negativePercentage}%)
- Neutral: ${report.summary.neutralCount} (${report.summary.neutralPercentage}%)
- Suspicious/generic flags: ${report.summary.suspiciousCount} (${report.summary.suspiciousPercentage}%)

## Final Recommendation

${report.recommendation.category}

${report.recommendation.rationale}

Suggested action: ${report.recommendation.suggestedAction}

## Suspicious/Generic Review Examples

${flagged
  .slice(0, 8)
  .map((flag) => {
    const record = report.records.find((candidate) => candidate.id === flag.recordId);
    return `- ${flag.riskLevel} review priority: ${escapeMarkdown(record?.text ?? "(record missing)")} Reasons: ${flag.reasons.join(", ")}. Evidence: ${flag.evidence.join(" ")}`;
  })
  .join("\n") || "- No suspicious/generic review pattern crossed the threshold."}

Flagged for manual review, not confirmed fake. Displayed examples follow input order.

## Repeated Keyword Groups

${report.themes.map((theme) => `- ${escapeMarkdown(theme.theme)}: ${theme.count} records`).join("\n") || "No keyword group reached two mentions."}

## Limitations

${report.limitations.map((item) => `- ${item}`).join("\n")}

## Full Record Evidence

All analysed rows are retained, including duplicates. Rule scores are uncalibrated and are not accuracy probabilities.

${report.records.map((record, index) => {
  const flag = report.qualityFlags.find((item) => item.recordId === record.id);
  return `### Record ${index + 1}: ${escapeMarkdown(record.id)}

Source ID: ${escapeMarkdown(record.sourceRecordId ?? "not supplied")} · Source: ${escapeMarkdown(record.source ?? "not supplied")}

${escapeMarkdown(record.text)}

Sentiment: ${record.sentiment}; rule score: ${record.confidence} (uncalibrated).
Positive cues: ${record.positiveKeywordMatches.join(", ") || "none"}; negative cues: ${record.negativeKeywordMatches.join(", ") || "none"}.
Quality flagged: ${flag?.isSuspicious ? "yes" : "no"}; review priority: ${flag?.riskLevel ?? "unavailable"}.
Reasons: ${flag?.reasons.join(", ") ?? "unavailable"}. Evidence: ${flag?.evidence.join(" ") ?? "unavailable"}.
`;
}).join("\n")}
`;
}

function escapeMarkdown(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\\`*_{}\[\]()#+!|]/g, "\\$&").replace(/\r?\n/g, " ");
}

function toPercentage(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
