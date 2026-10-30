export const SHOWCASE_TITLE = "Universal Opinion Intelligence & Trust Analysis Platform";
export const SHOWCASE_MAX_RECORDS = 250;
export const SHOWCASE_MAX_INPUT_CHARS = 250_000;
export const SHOWCASE_MAX_RECORD_CHARS = 5_000;

export const showcaseUseCases = [
  { value: "product", label: "Product Reviews", description: "Inspect product experience and review quality before manual comparison.", terms: ["battery", "charging", "delivery", "quality", "price", "support", "camera", "screen", "performance"] },
  { value: "college", label: "College Feedback", description: "Group anonymous student feedback about facilities and learning experience.", terms: ["lab", "classroom", "faculty", "placement", "canteen", "transport", "library", "internet", "administration", "campus services"] },
  { value: "healthcare", label: "Healthcare Reviews", description: "Review service experience only; sentiment does not establish clinical quality.", terms: ["waiting", "staff", "doctor", "billing", "cleanliness", "appointment", "pharmacy"] },
  { value: "brand", label: "Brand Reputation", description: "Summarize an imported feedback snapshot and recurring complaints.", terms: ["delivery", "support", "price", "quality", "trust", "refund", "app"] },
  { value: "public_service", label: "Public Services", description: "Group submitted service feedback for a human reviewer.", terms: ["road", "water", "electricity", "portal", "response", "sanitation", "transport", "application"] },
  { value: "public_figure", label: "Public Figure/Topic", description: "Summarize supplied comments; this is not a representative opinion poll.", terms: ["policy", "plan", "education", "transport", "communication", "funding"] },
  { value: "survey", label: "Survey Responses", description: "Review open-ended answers; closed questions and survey weighting need separate analysis.", terms: ["experience", "service", "access", "communication", "schedule"] },
  { value: "support", label: "Support Feedback", description: "Summarize one feedback entry per case, without automatic ticket resolution.", terms: ["ticket", "response", "resolution", "support", "refund", "waiting"] },
  { value: "local_business", label: "Local Business Reviews", description: "Inspect supplied customer experience records and recurring service themes.", terms: ["staff", "service", "price", "cleanliness", "waiting", "quality"] },
  { value: "social_media", label: "Social Media Comments", description: "Analyze pasted/exported comments; no live platform connection is used.", terms: ["content", "communication", "response", "policy", "topic"] }
] as const;

export type ShowcaseUseCase = (typeof showcaseUseCases)[number]["value"];

// Transparent English mention aliases, not learned topics or aspect sentiment.
export const showcaseThemeAliases: Partial<Record<ShowcaseUseCase, Record<string, string[]>>> = {
  college: {
    lab: ["lab", "labs", "laboratory", "laboratories"], classroom: ["classroom", "classrooms"],
    faculty: ["faculty", "teaching", "learning", "lecturer"], placement: ["placement", "placements", "training"],
    canteen: ["canteen", "cafeteria"], transport: ["transport", "bus", "buses"], library: ["library", "libraries"],
    internet: ["internet", "wifi", "wi-fi", "connectivity"], administration: ["administration", "admin"],
    "campus services": ["campus services", "campus service"]
  },
  product: { price: ["price", "pricing", "cost"], performance: ["performance", "speed"] },
  brand: { price: ["price", "pricing", "cost"], refund: ["refund", "refunds"] },
  healthcare: { pharmacy: ["pharmacy", "pharmacies"], appointment: ["appointment", "appointments"] },
  public_service: { road: ["road", "roads"], sanitation: ["sanitation", "garbage", "waste collection"], transport: ["transport", "bus", "buses"] }
};

export function getShowcaseThemes(useCase: string) {
  const selected = showcaseUseCases.find((item) => item.value === useCase);
  return selected?.terms.map((term) => ({ theme: term[0].toUpperCase() + term.slice(1), terms: showcaseThemeAliases[selected.value]?.[term] ?? [term] })) ?? [];
}
