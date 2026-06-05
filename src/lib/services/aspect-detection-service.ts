import type { AspectResult, PreparedDataset } from "@/types/analysis";

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "been",
  "being",
  "from",
  "have",
  "into",
  "just",
  "like",
  "more",
  "much",
  "only",
  "over",
  "really",
  "that",
  "their",
  "them",
  "then",
  "there",
  "this",
  "very",
  "with",
  "would",
  "your"
]);

export function detectAspects(preparedDataset: PreparedDataset): AspectResult[] {
  const aspectMap = new Map<string, { count: number; sampleRecordIds: string[] }>();

  preparedDataset.records.forEach((record) => {
    const uniqueTerms = new Set(extractCandidateTerms(record.text));
    uniqueTerms.forEach((term) => {
      const current = aspectMap.get(term) ?? { count: 0, sampleRecordIds: [] };
      current.count += 1;
      if (current.sampleRecordIds.length < 3) {
        current.sampleRecordIds.push(record.id);
      }
      aspectMap.set(term, current);
    });
  });

  return Array.from(aspectMap.entries())
    .map(([aspect, value]) => ({ aspect, ...value }))
    .filter((item) => item.count >= 2 || preparedDataset.records.length <= 5)
    .sort((a, b) => b.count - a.count || a.aspect.localeCompare(b.aspect))
    .slice(0, 12);
}

export function detectRecordAspects(text: string, topAspects: AspectResult[]) {
  const terms = new Set(extractCandidateTerms(text));
  return topAspects.filter((aspect) => terms.has(aspect.aspect)).map((aspect) => aspect.aspect);
}

function extractCandidateTerms(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4 && !STOP_WORDS.has(term) && Number.isNaN(Number(term)));
}
