import type {
  AnalysisIntent,
  PublicSearchResponse,
  PublicSearchResult,
  ResearchPlan,
  ResearchProviderKind,
  ResearchProviderResult,
  SearchProvider
} from "@/types/research";

const FUTURE_PROVIDERS: ResearchProviderKind[] = [
  "browser",
  "search-api",
  "serpapi",
  "brave-search",
  "google-custom-search"
];

export function buildResearchPlan({
  dateRange,
  expectedOutput,
  intent,
  language,
  platform,
  region,
  subject,
  targetSources
}: {
  dateRange: string;
  expectedOutput: ResearchPlan["expectedOutput"];
  intent: AnalysisIntent;
  language: string;
  platform: string;
  region: string;
  subject: string;
  targetSources: ResearchPlan["targetSources"];
}): ResearchPlan {
  const queryParts = [subject, intent.replace("-", " "), platform, region, language]
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    query: queryParts.join(" "),
    targetSources,
    region: region.trim() || "Not specified",
    language: language.trim() || "Not specified",
    dateRange: dateRange.trim() || "Not specified",
    expectedOutput,
    limitations: [
      "Only user-provided text, uploaded CSV records, or explicitly supplied public URLs are analysed in this build.",
      "No private, login-protected, CAPTCHA-protected, or hidden platform data is accessed.",
      "Public search providers are adapter-ready but not configured by default."
    ]
  };
}

export async function runPublicResearchProvider(plan: ResearchPlan): Promise<ResearchProviderResult> {
  const queries = buildSearchQueries(plan);
  const searchResults = await searchPublicSources({
    dateRange: plan.dateRange,
    language: plan.language,
    query: queries[0] ?? plan.query,
    region: plan.region
  });

  return {
    provider: searchResults.configured ? "search-api" : "mock-disabled",
    configured: searchResults.configured,
    queries,
    records: [],
    limitations: searchResults.configured ? searchResults.limitations : [
      "Web provider not configured. Paste public URLs, upload CSV data, or provide manual text to continue.",
      `Future provider adapters: ${FUTURE_PROVIDERS.join(", ")}.`
    ]
  };
}

export async function searchPublicSources({
  dateRange,
  language,
  query,
  region
}: {
  dateRange: string;
  language: string;
  query: string;
  region: string;
}): Promise<PublicSearchResponse> {
  const provider = getSearchProvider();

  if (provider === "brave") {
    return searchBrave({ dateRange, language, query, region });
  }

  return {
    provider,
    configured: false,
    query,
    results: [],
    limitations: [
      provider === "disabled"
        ? "Search provider is disabled. Set SEARCH_PROVIDER=brave and BRAVE_SEARCH_API_KEY to enable public source discovery."
        : `${provider} provider adapter is declared but not implemented in this build.`,
      "No search results were fabricated."
    ]
  };
}

export function buildSearchQueries(plan: ResearchPlan) {
  const base = plan.query.trim();
  const region = plan.region !== "Not specified" ? plan.region : "";
  const language = plan.language !== "Not specified" ? plan.language : "";

  return [
    [base, "reviews", region, language].filter(Boolean).join(" "),
    [base, "public opinion comments", region, language].filter(Boolean).join(" "),
    [base, "complaints issues sentiment", region, language].filter(Boolean).join(" "),
    [base, "campaign response audience reaction", region, language].filter(Boolean).join(" ")
  ].filter(Boolean);
}

function getSearchProvider(): SearchProvider {
  const provider = process.env.SEARCH_PROVIDER;

  if (provider === "brave" || provider === "serpapi" || provider === "tavily" || provider === "custom") {
    return provider;
  }

  return "disabled";
}

async function searchBrave({
  dateRange,
  language,
  query,
  region
}: {
  dateRange: string;
  language: string;
  query: string;
  region: string;
}): Promise<PublicSearchResponse> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    return {
      provider: "brave",
      configured: false,
      query,
      results: [],
      limitations: [
        "SEARCH_PROVIDER is set to brave, but BRAVE_SEARCH_API_KEY is not configured.",
        "No search results were fabricated."
      ]
    };
  }

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "10");
  url.searchParams.set("safesearch", "moderate");
  const searchLanguage = normalizeLanguage(language);
  if (searchLanguage) {
    url.searchParams.set("search_lang", searchLanguage);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Brave Search request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as BraveSearchPayload;
  const results = (payload.web?.results ?? [])
    .filter((result) => result.url?.startsWith("http://") || result.url?.startsWith("https://"))
    .slice(0, 10)
    .map<PublicSearchResult>((result, index) => ({
      id: `brave-${index}-${hashText(result.url)}`,
      title: stripHtml(result.title || result.url),
      url: result.url,
      snippet: stripHtml(result.description ?? ""),
      source: "brave",
      publishedAt: result.age
    }));

  return {
    provider: "brave",
    configured: true,
    query,
    results,
    limitations: [
      "Results come from Brave Search public web index.",
      "Only result URLs, titles, snippets, and publicly accessible extracted page text are used.",
      "No private, login-protected, CAPTCHA-protected, or hidden comments are accessed.",
      dateRange && dateRange !== "Not specified"
        ? `Date range was included in planning as "${dateRange}" but exact filtering depends on provider result metadata.`
        : "No date range filter was applied.",
      region && region !== "Not specified"
        ? `Region was included in planning as "${region}" but provider-level regional precision may vary.`
        : "No region filter was applied."
    ]
  };
}

interface BraveSearchPayload {
  web?: {
    results?: Array<{
      age?: string;
      description?: string;
      title?: string;
      url: string;
    }>;
  };
}

function normalizeLanguage(language: string) {
  const normalized = language.trim().toLowerCase();
  if (!normalized || normalized === "not specified") {
    return "";
  }
  if (normalized.startsWith("en") || normalized === "english") {
    return "en";
  }
  if (normalized.length === 2) {
    return normalized;
  }
  return "";
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function hashText(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}
