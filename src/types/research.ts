import type { AnalysisType, DataSource, ProjectGoal } from "@/types/project";

export type AnalysisIntent =
  | "topic"
  | "brand"
  | "product"
  | "profile"
  | "public-figure"
  | "campaign"
  | "website"
  | "custom";

export type ResearchDataSource = "public-web" | "url" | "manual-text" | "csv-upload" | "mixed";
export type ResearchExpectedOutput = "report-only" | "report-and-roadmap";
export type ResearchProviderKind = "mock-disabled" | "browser" | "search-api" | "serpapi" | "brave-search" | "google-custom-search";
export type SearchProvider = "disabled" | "brave" | "serpapi" | "tavily" | "custom";

export interface ResearchPlan {
  query: string;
  targetSources: ResearchDataSource[];
  region: string;
  language: string;
  dateRange: string;
  expectedOutput: ResearchExpectedOutput;
  limitations: string[];
}

export interface ConversationalAnalysisRequest {
  subject: string;
  intent: AnalysisIntent;
  goal: ProjectGoal;
  dataSource: ResearchDataSource;
  region: string;
  language: string;
  platform: string;
  dateRange: string;
  expectedOutput: ResearchExpectedOutput;
  manualText: string;
  urls: string;
}

export interface ResearchProviderResult {
  provider: ResearchProviderKind;
  configured: boolean;
  queries: string[];
  records: PublicResearchRecord[];
  limitations: string[];
}

export interface PublicSearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: SearchProvider;
  publishedAt?: string;
}

export interface PublicSearchResponse {
  provider: SearchProvider;
  configured: boolean;
  query: string;
  results: PublicSearchResult[];
  limitations: string[];
}

export interface PublicResearchRecord {
  id: string;
  text: string;
  sourceUrl?: string;
  sourceTitle?: string;
  metadata: Record<string, string>;
}

export interface UrlExtractionResult {
  url: string;
  title: string;
  description: string;
  text: string;
  records: PublicResearchRecord[];
  limitations: string[];
}

export interface OrchestrationProgressStep {
  key:
    | "planning"
    | "collecting"
    | "cleaning"
    | "sentiment"
    | "deep-analysis"
    | "recommendations"
    | "report"
    | "ready";
  label: string;
  status: "pending" | "active" | "complete" | "failed";
}

export interface OrchestrationResult {
  projectId: string;
  reportReady: boolean;
  limitations: string[];
}

export function mapIntentToAnalysisType(intent: AnalysisIntent): AnalysisType {
  switch (intent) {
    case "brand":
      return "Brand";
    case "product":
      return "Product";
    case "profile":
    case "public-figure":
      return "Person/Profile";
    case "campaign":
    case "topic":
      return "Political/Public Opinion";
    case "website":
    case "custom":
      return "Custom Text";
  }
}

export function mapResearchSourceToProjectSource(source: ResearchDataSource): DataSource {
  if (source === "csv-upload") {
    return "Upload CSV";
  }

  if (source === "public-web") {
    return "API later";
  }

  return "Paste Text";
}
