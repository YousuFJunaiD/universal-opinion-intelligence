"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Database,
  FileText,
  Gauge,
  Lightbulb,
  Network,
  Play,
  Loader2,
  Save,
  RefreshCw,
  Rows3,
  Sparkles,
  Target,
  TextSearch,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataIntakePanel } from "@/components/data-intake-panel";
import { DeepAnalysisDashboard } from "@/components/deep-analysis-dashboard";
import { ReportPreview } from "@/components/report-preview";
import { RecommendationDashboard } from "@/components/recommendation-dashboard";
import { SentimentDashboard } from "@/components/sentiment-dashboard";
import {
  clearAnalysisDataForNewDataset,
  generateRecommendationData,
  getAnalysisDataForProject,
  prepareAnalysisData,
  runDeepAnalysisData,
  runSentimentAnalysisData
} from "@/lib/data-services/analysis-data-service";
import { deleteDatasetData, getDatasetsForProject, replaceDatasetData } from "@/lib/data-services/dataset-data-service";
import {
  deleteProjectData,
  getProjectDataById,
  isApiDataMode,
  updateProjectData
} from "@/lib/data-services/project-data-service";
import {
  clearReportData,
  createReportExportData,
  generateReportSnapshotData,
  getReportDataForProject
} from "@/lib/data-services/report-data-service";
import { printReport } from "@/lib/services/report-export-service";
import type {
  AnalysisJob,
  AnalysisResult,
  MultiDimensionalAnalysisResult,
  PreparedDataset,
  SentimentLabel
} from "@/types/analysis";
import type { Dataset } from "@/types/dataset";
import type { AnalysisType, OpinionProject, ProjectGoal } from "@/types/project";
import type { ReportExport, ReportSnapshot } from "@/types/report";
import type { RecommendationResult } from "@/types/recommendation";

const analysisTypes: AnalysisType[] = [
  "Person/Profile",
  "Brand",
  "Product",
  "Political/Public Opinion",
  "Reviews",
  "Custom Text"
];

const projectGoals: ProjectGoal[] = [
  "Reputation",
  "Growth",
  "Complaint detection",
  "Audience understanding",
  "Crisis risk",
  "Product improvement"
];

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const [project, setProject] = useState<OpinionProject | null | undefined>(undefined);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [analysisJob, setAnalysisJob] = useState<AnalysisJob | null>(null);
  const [preparedDataset, setPreparedDataset] = useState<PreparedDataset | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [deepAnalysisResult, setDeepAnalysisResult] = useState<MultiDimensionalAnalysisResult | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult | null>(null);
  const [reportSnapshot, setReportSnapshot] = useState<ReportSnapshot | null>(null);
  const [reportExports, setReportExports] = useState<ReportExport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadProjectBundle = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setLoadError("");

    try {
      const [currentProject, datasets, analysisState, reportState] = await Promise.all([
        getProjectDataById(params.projectId),
        getDatasetsForProject(params.projectId),
        getAnalysisDataForProject(params.projectId),
        getReportDataForProject(params.projectId)
      ]);
      const currentDataset = datasets[0] ?? null;
      const validJob =
        analysisState.analysisJob?.datasetId === currentDataset?.id ? analysisState.analysisJob : null;
      const validPreparedDataset =
        analysisState.preparedDataset?.datasetId === currentDataset?.id ? analysisState.preparedDataset : null;
      const validResult =
        analysisState.analysisResult?.preparedDatasetId === validPreparedDataset?.id
          ? analysisState.analysisResult
          : null;
      const validDeepResult =
        analysisState.deepAnalysisResult?.analysisResultId === validResult?.id
          ? analysisState.deepAnalysisResult
          : null;
      const validRecommendation =
        analysisState.recommendationResult?.multiDimensionalAnalysisResultId === validDeepResult?.id
          ? analysisState.recommendationResult
          : null;
      const validReport =
        reportState.reportSnapshot?.analysisResultId === validResult?.id ? reportState.reportSnapshot : null;

      setProject(currentProject);
      setDataset(currentDataset);
      setAnalysisJob(validJob);
      setPreparedDataset(validPreparedDataset);
      setAnalysisResult(validResult);
      setDeepAnalysisResult(validDeepResult);
      setRecommendationResult(validRecommendation);
      setReportSnapshot(validReport);
      setReportExports(
        validReport
          ? reportState.reportExports.filter((item) => item.reportSnapshotId === validReport.id)
          : []
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load project.");
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId]);

  useEffect(() => {
    void loadProjectBundle(true);
  }, [loadProjectBundle]);

  async function runProjectAction(label: string, action: () => Promise<void>) {
    setActionError("");
    setBusyAction(label);
    try {
      await action();
      await loadProjectBundle(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDatasetSaved(savedDataset: Dataset) {
    await runProjectAction("Saving dataset", async () => {
      await clearAnalysisDataForNewDataset(params.projectId);
      await clearReportData(params.projectId);
      setDataset(savedDataset);
      setAnalysisJob(null);
      setPreparedDataset(null);
      setAnalysisResult(null);
      setDeepAnalysisResult(null);
      setRecommendationResult(null);
      setReportSnapshot(null);
      setReportExports([]);
    });
  }

  function handlePrepareAnalysis() {
    if (!dataset || !project) {
      return;
    }

    void runProjectAction("Preparing analysis", async () => {
      await clearReportData(project.id);
      await prepareAnalysisData(project.id, dataset);
    });
  }

  function handleRunAnalysis() {
    if (!preparedDataset || !analysisJob || !project) {
      return;
    }

    void runProjectAction("Running sentiment analysis", async () => {
      await clearReportData(project.id);
      await runSentimentAnalysisData(preparedDataset, analysisJob);
    });
  }

  function handleRunDeepAnalysis() {
    if (!preparedDataset || !analysisResult) {
      return;
    }

    void runProjectAction("Running deep analysis", async () => {
      await clearReportData(analysisResult.projectId);
      await runDeepAnalysisData(preparedDataset, analysisResult);
    });
  }

  function handleGenerateRecommendations() {
    if (!analysisResult || !deepAnalysisResult) {
      return;
    }

    void runProjectAction("Generating recommendations", async () => {
      await clearReportData(analysisResult.projectId);
      await generateRecommendationData(analysisResult, deepAnalysisResult);
    });
  }

  function handleGenerateReportSnapshot() {
    if (!analysisResult || !dataset || !preparedDataset || !project) {
      return;
    }

    void runProjectAction("Generating report snapshot", async () => {
      await generateReportSnapshotData({
        analysisResult,
        dataset,
        deepAnalysisResult,
        preparedDataset,
        project,
        recommendationResult
      });
    });
  }

  function handleExportPdf() {
    if (!reportSnapshot) {
      return;
    }

    void runProjectAction("Saving export history", async () => {
      const reportExport = await createReportExportData(reportSnapshot);
      setReportExports((currentExports) => [reportExport, ...currentExports]);
      window.setTimeout(() => printReport(), 50);
    });
  }

  function handleUpdateProject(updates: { analysisType: AnalysisType; goal: ProjectGoal; name: string }) {
    if (!project) {
      return;
    }

    void runProjectAction("Updating project", async () => {
      await updateProjectData(project.id, updates);
    });
  }

  function handleDeleteProject() {
    if (!project) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this project and all linked datasets, analysis results, recommendations, reports, and export history?"
    );
    if (!confirmed) {
      return;
    }

    void runProjectAction("Deleting project", async () => {
      await deleteProjectData(project.id);
      router.push("/dashboard");
    });
  }

  function handleDeleteDataset() {
    if (!dataset) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this dataset? This will also clear prepared data, analysis results, recommendations, reports, and export history."
    );
    if (!confirmed) {
      return;
    }

    void runProjectAction("Deleting dataset", async () => {
      await deleteDatasetData(dataset);
    });
  }

  if (isLoading || project === undefined) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-8">
        <Card className="max-w-md p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <h1 className="mt-5 text-xl font-bold text-slate-950">Loading project</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Fetching the latest saved project state.</p>
        </Card>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-8">
        <Card className="max-w-md p-6 text-center">
          <h1 className="text-xl font-bold text-slate-950">Failed to load project</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{loadError}</p>
          <Button className="mt-5" onClick={() => loadProjectBundle(true)}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </Card>
      </main>
    );
  }

  if (project === null) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-8">
        <Card className="max-w-md p-6 text-center">
          <h1 className="text-xl font-bold text-slate-950">Project not found</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Local draft projects are stored in this browser. Create a new one to continue.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/onboarding">Create project</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 lg:px-10">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950" href="/dashboard">
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mt-6 flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-950">{project.name}</h1>
            <span className={getStatusClassName(project.status)}>
              Status: {project.status}
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Prepare the saved dataset for analysis with cleaning and quality checks. Sentiment ML, scoring, and analysis results are intentionally excluded from Phase 3.
          </p>
        </div>
      </div>

      {actionError ? (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {actionError}
        </div>
      ) : null}

      {busyAction ? (
        <div className="mt-6 inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          {busyAction}
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 lg:grid-cols-5">
        <DetailCard icon={TextSearch} label="Analysis type" value={project.analysisType} />
        <DetailCard icon={Database} label="Data source" value={project.dataSource} />
        <DetailCard icon={Target} label="Goal" value={project.goal} />
        <DetailCard icon={Calendar} label="Created" value={new Date(project.createdAt).toLocaleDateString()} />
        <DetailCard icon={Database} label="Visibility" value={project.workspaceId ? "Workspace" : "Personal"} />
      </section>

      <ProjectSettingsPanel
        busy={Boolean(busyAction)}
        onDeleteProject={handleDeleteProject}
        onUpdateProject={handleUpdateProject}
        project={project}
      />

      <DataIntakePanel
        dataset={dataset}
        onDatasetSaved={handleDatasetSaved}
        persistDataset={replaceDatasetData}
        projectId={project.id}
        savedLabel={isApiDataMode() ? "Dataset saved to API" : "Dataset saved locally"}
      />

      <DatasetPreview dataset={dataset} onDeleteDataset={handleDeleteDataset} />

      <AnalysisPreparationPanel
        analysisJob={analysisJob}
        dataset={dataset}
        onPrepareAnalysis={handlePrepareAnalysis}
        preparedDataset={preparedDataset}
      />

      <SentimentAnalysisPanel
        analysisResult={analysisResult}
        onRunAnalysis={handleRunAnalysis}
        projectStatus={project.status}
      />

      <ReportSnapshotPanel
        analysisResult={analysisResult}
        deepAnalysisResult={deepAnalysisResult}
        exportHistory={reportExports}
        onGenerateRecommendations={handleGenerateRecommendations}
        onExportPdf={handleExportPdf}
        onRunDeepAnalysis={handleRunDeepAnalysis}
        onGenerateReportSnapshot={handleGenerateReportSnapshot}
        recommendationResult={recommendationResult}
        reportSnapshot={reportSnapshot}
      />
    </main>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value
}: {
  icon: typeof TextSearch;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-base font-bold text-slate-950">{value}</p>
    </Card>
  );
}

function ProjectSettingsPanel({
  busy,
  onDeleteProject,
  onUpdateProject,
  project
}: {
  busy: boolean;
  onDeleteProject: () => void;
  onUpdateProject: (updates: { analysisType: AnalysisType; goal: ProjectGoal; name: string }) => void;
  project: OpinionProject;
}) {
  const [analysisType, setAnalysisType] = useState<AnalysisType>(project.analysisType);
  const [goal, setGoal] = useState<ProjectGoal>(project.goal);
  const [name, setName] = useState(project.name);

  useEffect(() => {
    setAnalysisType(project.analysisType);
    setGoal(project.goal);
    setName(project.name);
  }, [project.analysisType, project.goal, project.name]);

  const hasChanges =
    name.trim() !== project.name || analysisType !== project.analysisType || goal !== project.goal;

  return (
    <Card className="mt-8 p-6">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold text-primary">Project management</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Project settings</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Update project metadata or delete this project. Existing datasets and analysis remain linked unless the project is deleted.
          </p>
        </div>
        <Button disabled={busy || !hasChanges || !name.trim()} onClick={() => onUpdateProject({ analysisType, goal, name })}>
          <Save className="h-4 w-4" />
          Save changes
        </Button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="project-settings-name">Project name</Label>
          <Input
            id="project-settings-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-settings-analysis-type">Analysis type</Label>
          <select
            className="h-11 w-full rounded-md border bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            id="project-settings-analysis-type"
            onChange={(event) => setAnalysisType(event.target.value as AnalysisType)}
            value={analysisType}
          >
            {analysisTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-settings-goal">Goal</Label>
          <select
            className="h-11 w-full rounded-md border bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            id="project-settings-goal"
            onChange={(event) => setGoal(event.target.value as ProjectGoal)}
            value={goal}
          >
            {projectGoals.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-sm font-bold text-red-900">Danger zone</h3>
            <p className="mt-1 text-sm leading-6 text-red-700">
              Delete this project and every linked dataset, analysis result, recommendation, report, and export record.
            </p>
          </div>
          <Button
            className="border-red-200 bg-red-600 text-white hover:bg-red-700"
            disabled={busy}
            onClick={onDeleteProject}
          >
            <Trash2 className="h-4 w-4" />
            Delete project
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AnalysisPreparationPanel({
  analysisJob,
  dataset,
  onPrepareAnalysis,
  preparedDataset
}: {
  analysisJob: AnalysisJob | null;
  dataset: Dataset | null;
  onPrepareAnalysis: () => void;
  preparedDataset: PreparedDataset | null;
}) {
  const canPrepare = Boolean(dataset);

  return (
    <Card className="mt-8 p-6">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold text-primary">Phase 3</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Analysis Preparation</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Clean the dataset, remove exact duplicates, calculate quality metrics, and create a ready analysis job.
          </p>
        </div>
        <Button disabled={!canPrepare} onClick={onPrepareAnalysis}>
          <Sparkles className="h-4 w-4" />
          Prepare Analysis
        </Button>
      </div>

      {!dataset ? (
        <p className="mt-5 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          Add a dataset before preparing analysis.
        </p>
      ) : null}

      {analysisJob ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
            {analysisJob.status === "processing" ? <Loader2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            Job status: {analysisJob.status}
          </span>
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
            Job ID: {analysisJob.id.slice(0, 8)}
          </span>
        </div>
      ) : null}

      {preparedDataset ? <PreparationSummaryView preparedDataset={preparedDataset} /> : null}
    </Card>
  );
}

function SentimentAnalysisPanel({
  analysisResult,
  onRunAnalysis,
  projectStatus
}: {
  analysisResult: AnalysisResult | null;
  onRunAnalysis: () => void;
  projectStatus: OpinionProject["status"];
}) {
  const canRunAnalysis =
    projectStatus === "Ready for Analysis" || projectStatus === "Analysed" || projectStatus === "Report Ready";

  return (
    <Card className="mt-8 p-6">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold text-primary">Phase 4</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Basic Sentiment Engine</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Current engine: configured sentiment provider with rule-based fallback and stored model metadata.
          </p>
        </div>
        {canRunAnalysis ? (
          <Button onClick={onRunAnalysis}>
            <Play className="h-4 w-4" />
            Run Analysis
          </Button>
        ) : (
          <Button disabled>
            <Play className="h-4 w-4" />
            Run Analysis
          </Button>
        )}
      </div>

      {!canRunAnalysis ? (
        <p className="mt-5 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          Prepare the dataset before running the baseline sentiment engine.
        </p>
      ) : null}

      {analysisResult ? <SentimentResultsView result={analysisResult} /> : null}
    </Card>
  );
}

function ReportSnapshotPanel({
  analysisResult,
  deepAnalysisResult,
  exportHistory,
  onExportPdf,
  onGenerateRecommendations,
  onGenerateReportSnapshot,
  onRunDeepAnalysis,
  recommendationResult,
  reportSnapshot
}: {
  analysisResult: AnalysisResult | null;
  deepAnalysisResult: MultiDimensionalAnalysisResult | null;
  exportHistory: ReportExport[];
  onExportPdf: () => void;
  onGenerateRecommendations: () => void;
  onGenerateReportSnapshot: () => void;
  onRunDeepAnalysis: () => void;
  recommendationResult: RecommendationResult | null;
  reportSnapshot: ReportSnapshot | null;
}) {
  const canGenerate = Boolean(analysisResult);

  return (
    <>
      <Card className="mt-8 p-6">
        <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-start">
          <div>
          <p className="text-sm font-semibold text-primary">Phase 6</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Export-Ready Report System</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Generate a saved report snapshot from existing analysis data, then export it through the print-ready PDF flow.
          </p>
          </div>
          <Button disabled={!canGenerate} onClick={onGenerateReportSnapshot}>
            <FileText className="h-4 w-4" />
            Generate Report Snapshot
          </Button>
        </div>

        {!canGenerate ? (
          <p className="mt-5 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            Run sentiment analysis before generating a report snapshot.
          </p>
        ) : null}

        {analysisResult ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={onRunDeepAnalysis} variant="outline">
              <Network className="h-4 w-4" />
              Run Deep Analysis
            </Button>
            {deepAnalysisResult ? (
              <span className="rounded-md bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800">
                Deep analysis saved
              </span>
            ) : null}
          </div>
        ) : null}

        {deepAnalysisResult ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={onGenerateRecommendations} variant="outline">
              <Lightbulb className="h-4 w-4" />
              Generate Recommendations
            </Button>
            {recommendationResult ? (
              <span className="rounded-md bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
                Recommendations saved
              </span>
            ) : null}
          </div>
        ) : null}
      </Card>

      {deepAnalysisResult ? <DeepAnalysisDashboard result={deepAnalysisResult} /> : null}

      {recommendationResult ? <RecommendationDashboard result={recommendationResult} /> : null}

      {reportSnapshot ? (
        <ReportPreview exportHistory={exportHistory} onExportPdf={onExportPdf} snapshot={reportSnapshot} />
      ) : null}
    </>
  );
}

function SentimentResultsView({ result }: { result: AnalysisResult }) {
  const modelMetadata = result.modelMetadata ?? {
    provider: "rule-based",
    modelName: "Rule-Based Baseline",
    modelVersion: "1.0.0",
    confidence: 0,
    processingTimeMs: 0
  };

  return (
      <div className="mt-6">
        <SentimentDashboard result={result} />

      <div className="mt-6 rounded-md border bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
        Provider: {modelMetadata.provider} · Model: {modelMetadata.modelName}{" "}
        ({modelMetadata.modelVersion}) · Processing: {modelMetadata.processingTimeMs} ms
        {modelMetadata.fallbackFrom ? (
          <span className="block pt-1 text-amber-700">
            Fallback used after {modelMetadata.fallbackFrom} failed: {modelMetadata.fallbackReason}
          </span>
        ) : null}
      </div>

      <div className="mt-8 rounded-md border bg-white">
        <div className="flex flex-col justify-between gap-3 border-b px-5 py-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-base font-bold text-slate-950">Analysed records</h3>
            <p className="mt-1 text-sm text-slate-500">Detailed rule-based label and confidence for each prepared record.</p>
          </div>
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
            {result.summary.totalAnalysed} rows
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-20 px-4 py-3">No.</th>
              <th className="px-4 py-3">Text</th>
              <th className="w-32 px-4 py-3">Sentiment</th>
              <th className="w-44 px-4 py-3">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {result.records.map((record, index) => (
              <tr key={record.id}>
                <td className="px-4 py-3 align-top font-semibold text-slate-500">{index + 1}</td>
                <td className="px-4 py-3 leading-6 text-slate-800">{record.text}</td>
                <td className="px-4 py-3 align-top">
                  <SentimentBadge sentiment={record.sentiment} />
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-20 rounded-full bg-slate-100">
                      <div className={getConfidenceBarClassName(record.sentiment)} style={{ width: `${Math.round(record.confidence * 100)}%` }} />
                    </div>
                    <span className="font-semibold text-slate-700">{Math.round(record.confidence * 100)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: SentimentLabel }) {
  return <span className={getSentimentBadgeClassName(sentiment)}>{sentiment}</span>;
}

function PreparationSummaryView({ preparedDataset }: { preparedDataset: PreparedDataset }) {
  const summary = preparedDataset.summary;

  return (
    <div className="mt-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Original records" value={String(summary.originalRecords)} />
        <Metric label="Clean records" value={String(summary.cleanRecords)} />
        <Metric label="Duplicates removed" value={String(summary.removedDuplicates)} />
        <Metric label="Empty removed" value={String(summary.removedEmptyRecords)} />
        <Metric label="Language" value={summary.language} />
        <Metric label="Readiness score" value={`${summary.readinessScore}/100`} icon={Gauge} />
      </div>

      <div className="mt-6 overflow-hidden rounded-md border">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Quality check</th>
              <th className="px-4 py-3">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            <QualityRow label="Total records" value={summary.quality.totalRecords} />
            <QualityRow label="Duplicate count" value={summary.quality.duplicateCount} />
            <QualityRow label="Empty removed count" value={summary.quality.emptyRemovedCount} />
            <QualityRow label="Average text length" value={summary.quality.averageTextLength} />
            <QualityRow label="Shortest text length" value={summary.quality.shortestTextLength} />
            <QualityRow label="Longest text length" value={summary.quality.longestTextLength} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon?: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-white p-4">
      {Icon ? <Icon className="mb-3 h-4 w-4 text-primary" /> : null}
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function QualityRow({ label, value }: { label: string; value: number }) {
  return (
    <tr>
      <td className="px-4 py-3 font-semibold text-slate-700">{label}</td>
      <td className="px-4 py-3 text-slate-800">{value}</td>
    </tr>
  );
}

function getStatusClassName(status: OpinionProject["status"]) {
  if (status === "Report Ready") {
    return "rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800";
  }

  if (status === "Analysed") {
    return "rounded-md bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800";
  }

  if (status === "Ready for Analysis") {
    return "rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800";
  }

  if (status === "Data Added") {
    return "rounded-md bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-800";
  }

  return "rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800";
}

function getSentimentBadgeClassName(sentiment: SentimentLabel) {
  if (sentiment === "positive") {
    return "inline-flex rounded-md bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-800";
  }

  if (sentiment === "negative") {
    return "inline-flex rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700";
  }

  return "inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700";
}

function getConfidenceBarClassName(sentiment: SentimentLabel) {
  if (sentiment === "positive") {
    return "h-2 rounded-full bg-teal-600";
  }

  if (sentiment === "negative") {
    return "h-2 rounded-full bg-red-600";
  }

  return "h-2 rounded-full bg-slate-500";
}

function DatasetPreview({ dataset, onDeleteDataset }: { dataset: Dataset | null; onDeleteDataset: () => void }) {
  if (!dataset) {
    return (
      <Card className="mt-8 p-6">
        <h2 className="text-lg font-bold text-slate-950">Dataset preview</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          No dataset has been saved for this project yet. Use Data Intake to add paste text or a CSV column.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-8 p-6">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-start">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Dataset preview</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Saved raw records linked to this project ID.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
            <Rows3 className="h-4 w-4" />
            {dataset.recordCount} records
          </span>
          <Button className="border-red-200 text-red-700 hover:bg-red-50" onClick={onDeleteDataset} variant="outline">
            <Trash2 className="h-4 w-4" />
            Delete dataset
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <DetailCard
          icon={Database}
          label="Source type"
          value={dataset.sourceType === "paste_text" ? "Paste Text" : "Upload CSV"}
        />
        <DetailCard icon={Calendar} label="Created date" value={new Date(dataset.createdAt).toLocaleDateString()} />
        <DetailCard icon={Rows3} label="Record count" value={String(dataset.recordCount)} />
      </div>

      <div className="mt-6 overflow-hidden rounded-md border">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-20 px-4 py-3">No.</th>
              <th className="px-4 py-3">Text</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {dataset.records.slice(0, 10).map((record, index) => (
              <tr key={record.id}>
                <td className="px-4 py-3 font-semibold text-slate-500">{index + 1}</td>
                <td className="px-4 py-3 leading-6 text-slate-800">{record.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
          Showing first {Math.min(dataset.records.length, 10)} saved records
        </div>
      </div>
    </Card>
  );
}
