import type { Dataset } from "@/types/dataset";
import type { AnalysisJob, PreparedDataset, PreparationSummary } from "@/types/analysis";
import { cleanDatasetRecords } from "@/lib/services/text-cleaning-service";

export function prepareDatasetForAnalysis(dataset: Dataset, analysisJob: AnalysisJob): PreparedDataset {
  const cleaningResult = cleanDatasetRecords(dataset.records);
  const summary = buildPreparationSummary({
    cleanRecords: cleaningResult.records.length,
    duplicateCount: cleaningResult.duplicateCount,
    emptyRemovedCount: cleaningResult.emptyRemovedCount,
    originalRecords: dataset.records.length,
    textLengths: cleaningResult.records.map((record) => record.text.length)
  });

  return {
    id: crypto.randomUUID(),
    projectId: dataset.projectId,
    datasetId: dataset.id,
    analysisJobId: analysisJob.id,
    createdAt: new Date().toISOString(),
    records: cleaningResult.records,
    summary
  };
}

function buildPreparationSummary({
  cleanRecords,
  duplicateCount,
  emptyRemovedCount,
  originalRecords,
  textLengths
}: {
  cleanRecords: number;
  duplicateCount: number;
  emptyRemovedCount: number;
  originalRecords: number;
  textLengths: number[];
}): PreparationSummary {
  const totalLength = textLengths.reduce((sum, length) => sum + length, 0);
  const averageTextLength = cleanRecords === 0 ? 0 : Math.round(totalLength / cleanRecords);
  const shortestTextLength = textLengths.length === 0 ? 0 : Math.min(...textLengths);
  const longestTextLength = textLengths.length === 0 ? 0 : Math.max(...textLengths);

  return {
    originalRecords,
    cleanRecords,
    removedDuplicates: duplicateCount,
    removedEmptyRecords: emptyRemovedCount,
    readinessScore: calculateReadinessScore({
      cleanRecords,
      duplicateCount,
      emptyRemovedCount,
      originalRecords
    }),
    language: detectLanguagePlaceholder(),
    quality: {
      totalRecords: originalRecords,
      duplicateCount,
      emptyRemovedCount,
      averageTextLength,
      shortestTextLength,
      longestTextLength
    }
  };
}

function calculateReadinessScore({
  cleanRecords,
  duplicateCount,
  emptyRemovedCount,
  originalRecords
}: {
  cleanRecords: number;
  duplicateCount: number;
  emptyRemovedCount: number;
  originalRecords: number;
}) {
  if (cleanRecords === 0 || originalRecords === 0) {
    return 0;
  }

  const removedRatio = (duplicateCount + emptyRemovedCount) / originalRecords;
  const volumePenalty = cleanRecords < 5 ? 20 : 0;
  const qualityPenalty = Math.round(removedRatio * 35);

  return Math.max(0, Math.min(100, 100 - volumePenalty - qualityPenalty));
}

function detectLanguagePlaceholder(): "unknown" {
  return "unknown";
}
