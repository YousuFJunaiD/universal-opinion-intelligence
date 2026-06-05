import { ModelEvaluationWorkbench } from "@/components/model-evaluation-workbench";
import { getAnalysisProvider, getFastApiMlUrl } from "@/lib/ml/analysis-provider";

export default function EvaluationPage() {
  const provider = getAnalysisProvider();

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="border-b pb-6">
        <p className="text-sm font-semibold text-primary">Model evaluation</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Benchmark evaluation metrics</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Evaluate the active sentiment provider against labelled benchmark data and export real metrics for research reporting.
        </p>
      </div>

      <ModelEvaluationWorkbench
        fastApiConfigured={Boolean(getFastApiMlUrl())}
        provider={provider}
      />
    </main>
  );
}
