import type { DatasetRecord } from "@/types/dataset";

export interface TextCleaningResult {
  records: DatasetRecord[];
  duplicateCount: number;
  emptyRemovedCount: number;
}

export function cleanDatasetRecords(records: DatasetRecord[]): TextCleaningResult {
  const seen = new Set<string>();
  let duplicateCount = 0;
  let emptyRemovedCount = 0;
  const cleanedRecords: DatasetRecord[] = [];

  records.forEach((record, index) => {
    const text = cleanText(record.text);

    if (!text) {
      emptyRemovedCount += 1;
      return;
    }

    if (seen.has(text)) {
      duplicateCount += 1;
      return;
    }

    seen.add(text);
    cleanedRecords.push({
      ...record,
      id: crypto.randomUUID(),
      text,
      rowIndex: index
    });
  });

  return {
    records: cleanedRecords,
    duplicateCount,
    emptyRemovedCount
  };
}

export function cleanText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}
