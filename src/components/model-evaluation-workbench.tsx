"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileJson, Loader2, Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runModelEvaluation } from "@/lib/api/client";
import {
  exportEvaluationCsv,
  exportEvaluationJson,
  parseBenchmarkText
} from "@/lib/services/benchmark-dataset-service";
import {
  getModelEvaluationResults,
  saveBenchmarkDataset,
  saveModelEvaluationResult
} from "@/lib/repositories/evaluation-repository";
import type { AnalysisProvider, SentimentLabel } from "@/types/analysis";
import type { BenchmarkDataset, ModelEvaluationResult } from "@/types/evaluation";

const DEFAULT_INPUT = "text,expectedSentiment\n\"The product is excellent and helpful\",positive\n\"The app is slow and broken\",negative\n\"The delivery arrived yesterday\",neutral";
const SENTIMENT_LABELS: SentimentLabel[] = ["positive", "negative", "neutral"];

export function ModelEvaluationWorkbench({
  fastApiConfigured,
  provider
}: {
  fastApiConfigured: boolean;
  provider: AnalysisProvider;
}) {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [dataset, setDataset] = useState<BenchmarkDataset | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ModelEvaluationResult | null>(null);
  const [savedResults, setSavedResults] = useState<ModelEvaluationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    setSavedResults(getModelEvaluationResults());
  }, []);

  const parsedPreview = useMemo(() => parseBenchmarkText(input, "paste"), [input]);

  function loadPreview() {
    setErrors(parsedPreview.errors);
    setDataset(parsedPreview.dataset ?? null);
  }

  async function handleFileUpload(file?: File) {
    if (!file) {
      return;
    }

    const text = await file.text();
    setInput(text);
    const parsed = parseBenchmarkText(text, "csv");
    setErrors(parsed.errors);
    setDataset(parsed.dataset ?? null);
  }

  async function handleRunEvaluation() {
    const activeDataset = dataset ?? parsedPreview.dataset;
    if (!activeDataset) {
      setErrors(parsedPreview.errors.length ? parsedPreview.errors : ["Create a valid benchmark dataset first."]);
      return;
    }

    setIsRunning(true);
    setRunError(null);

    try {
      const response = await runModelEvaluation({ dataset: activeDataset });
      saveBenchmarkDataset(activeDataset);
      saveModelEvaluationResult(response.result);
      setDataset(activeDataset);
      setResult(response.result);
      setSavedResults(getModelEvaluationResults());
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Evaluation failed.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Current provider" value={provider} />
        <MetricCard label="FastAPI URL" value={fastApiConfigured ? "Configured" : "Not configured"} />
        <MetricCard label="Benchmark records" value={String(dataset?.records.length ?? parsedPreview.dataset?.records.length ?? 0)} />
        <MetricCard label="Latest F1" value={result ? formatMetric(result.f1) : "Pending"} />
      </section>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Benchmark dataset</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Metrics are computed only from user-provided labelled benchmark data.
            </p>
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            Upload CSV
            <input
              accept=".csv,text/csv"
              className="sr-only"
              type="file"
              onChange={(event) => void handleFileUpload(event.target.files?.[0])}
            />
          </label>
        </div>

        <div className="mt-5">
          <Label htmlFor="benchmark-data">Paste labelled records</Label>
          <Textarea
            id="benchmark-data"
            className="mt-2 min-h-44 font-mono text-xs"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Required columns: text, expectedSentiment. Accepted labels: positive, negative, neutral.
          </p>
        </div>

        {errors.length ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errors.slice(0, 4).map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="outline" onClick={loadPreview}>
            Preview benchmark
          </Button>
          <Button disabled={isRunning} onClick={handleRunEvaluation}>
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run evaluation
          </Button>
        </div>

        {runError ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {runError}
          </p>
        ) : null}

        {dataset ? <BenchmarkPreview dataset={dataset} /> : null}
      </Card>

      {result ? <EvaluationResultView result={result} /> : <EmptyResults />}

      {savedResults.length ? (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-950">Saved evaluation runs</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Dataset</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Accuracy</th>
                  <th className="px-4 py-3">F1</th>
                  <th className="px-4 py-3">Evaluated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {savedResults.slice(0, 5).map((savedResult) => (
                  <tr key={savedResult.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{savedResult.benchmarkDatasetName}</td>
                    <td className="px-4 py-3 text-slate-600">{savedResult.provider}</td>
                    <td className="px-4 py-3 text-slate-600">{formatMetric(savedResult.accuracy)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatMetric(savedResult.f1)}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(savedResult.evaluatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function BenchmarkPreview({ dataset }: { dataset: BenchmarkDataset }) {
  return (
    <div className="mt-6 rounded-md border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-bold text-slate-950">Preview</h3>
        <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {dataset.records.length} records
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-24 px-4 py-3">No.</th>
              <th className="px-4 py-3">Text</th>
              <th className="w-44 px-4 py-3">Expected</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dataset.records.slice(0, 8).map((record, index) => (
              <tr key={record.id}>
                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                <td className="px-4 py-3 text-slate-800">{record.text}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{record.expectedSentiment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EvaluationResultView({ result }: { result: ModelEvaluationResult }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Evaluation result</h2>
          <p className="mt-2 text-sm text-slate-600">
            {result.modelName} ({result.modelVersion}) evaluated on {result.totalRecords} labelled records.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => exportEvaluationJson(result)}>
            <FileJson className="h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => exportEvaluationCsv(result)}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Accuracy" value={formatMetric(result.accuracy)} />
        <Metric label="Precision" value={formatMetric(result.precision)} />
        <Metric label="Recall" value={formatMetric(result.recall)} />
        <Metric label="F1 score" value={formatMetric(result.f1)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ConfusionMatrixTable result={result} />
        <PerClassMetricsTable result={result} />
      </div>

      <WrongPredictionsTable result={result} />
    </Card>
  );
}

function ConfusionMatrixTable({ result }: { result: ModelEvaluationResult }) {
  return (
    <div className="rounded-md border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-bold text-slate-950">Confusion matrix</h3>
        <p className="mt-1 text-xs text-slate-500">Rows are expected labels; columns are predictions.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-center text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Expected</th>
              {SENTIMENT_LABELS.map((label) => (
                <th key={label} className="px-4 py-3">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {SENTIMENT_LABELS.map((expected) => (
              <tr key={expected}>
                <td className="px-4 py-3 text-left font-semibold text-slate-900">{expected}</td>
                {SENTIMENT_LABELS.map((predicted) => (
                  <td key={predicted} className="px-4 py-3 text-slate-700">
                    {result.confusionMatrix[expected][predicted]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PerClassMetricsTable({ result }: { result: ModelEvaluationResult }) {
  return (
    <div className="rounded-md border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-bold text-slate-950">Per-class metrics</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Precision</th>
              <th className="px-4 py-3">Recall</th>
              <th className="px-4 py-3">F1</th>
              <th className="px-4 py-3">Support</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {result.perClassMetrics.map((metric) => (
              <tr key={metric.label}>
                <td className="px-4 py-3 font-semibold text-slate-900">{metric.label}</td>
                <td className="px-4 py-3 text-slate-600">{formatMetric(metric.precision)}</td>
                <td className="px-4 py-3 text-slate-600">{formatMetric(metric.recall)}</td>
                <td className="px-4 py-3 text-slate-600">{formatMetric(metric.f1)}</td>
                <td className="px-4 py-3 text-slate-600">{metric.support}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WrongPredictionsTable({ result }: { result: ModelEvaluationResult }) {
  return (
    <div className="mt-6 rounded-md border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-bold text-slate-950">Wrong predictions</h3>
        <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {result.wrongPredictions.length} rows
        </span>
      </div>
      {result.wrongPredictions.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Predicted</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Text</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.wrongPredictions.map((prediction) => (
                <tr key={prediction.recordId}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{prediction.expectedSentiment}</td>
                  <td className="px-4 py-3 text-slate-600">{prediction.predictedSentiment}</td>
                  <td className="px-4 py-3 text-slate-600">{Math.round(prediction.confidence * 100)}%</td>
                  <td className="px-4 py-3 text-slate-700">{prediction.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-4 py-5 text-sm font-semibold text-slate-600">No wrong predictions in this benchmark run.</p>
      )}
    </div>
  );
}

function EmptyResults() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-slate-950">Benchmark metrics</h2>
      <p className="mt-3 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
        Run evaluation on labelled benchmark data to calculate accuracy, precision, recall, F1, and confusion matrix values.
      </p>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 break-words text-base font-bold text-slate-950">{value}</p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function formatMetric(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}
