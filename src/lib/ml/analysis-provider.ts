import type { AnalysisProvider } from "@/types/analysis";

export function getAnalysisProvider(): AnalysisProvider {
  const provider = process.env.ANALYSIS_PROVIDER;
  if (provider === "fastapi" || provider === "azure") {
    return provider;
  }
  return "rule-based";
}

export function getFastApiMlUrl() {
  return process.env.FASTAPI_ML_URL;
}
