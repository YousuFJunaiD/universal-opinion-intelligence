import type { SentimentLabel } from "@/types/analysis";
import type { BenchmarkDataset, BenchmarkRecord, ModelEvaluationResult } from "@/types/evaluation";

const SENTIMENT_LABELS: SentimentLabel[] = ["positive", "negative", "neutral"];

export interface BenchmarkParseResult {
  dataset?: BenchmarkDataset;
  errors: string[];
}

export function parseBenchmarkText(input: string, sourceType: BenchmarkDataset["sourceType"]): BenchmarkParseResult {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { errors: ["Add at least one labelled benchmark record."] };
  }

  const rows = lines.map(parseCsvLine);
  const hasHeader = rows[0]?.some((cell) => normalizeHeader(cell) === "expectedsentiment");
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const header = hasHeader ? rows[0].map(normalizeHeader) : [];
  const textIndex = hasHeader ? findHeaderIndex(header, ["text", "comment", "review", "content"]) : 0;
  const sentimentIndex = hasHeader ? findHeaderIndex(header, ["expectedsentiment", "sentiment", "label"]) : 1;
  const errors: string[] = [];
  const records: BenchmarkRecord[] = [];

  if (textIndex === -1 || sentimentIndex === -1) {
    return { errors: ["CSV header must include text and expectedSentiment columns."] };
  }

  dataRows.forEach((row, index) => {
    const text = row[textIndex]?.trim() ?? "";
    const expectedSentiment = normalizeSentiment(row[sentimentIndex]);

    if (!text) {
      errors.push(`Row ${index + 1}: text is required.`);
      return;
    }

    if (!expectedSentiment) {
      errors.push(`Row ${index + 1}: expectedSentiment must be positive, negative, or neutral.`);
      return;
    }

    records.push({
      id: `benchmark-record-${index + 1}-${hashText(text)}`,
      text,
      expectedSentiment
    });
  });

  if (records.length === 0) {
    errors.push("No valid benchmark records were found.");
  }

  return {
    dataset: records.length
      ? {
          id: crypto.randomUUID(),
          name: `Benchmark ${new Date().toLocaleString()}`,
          createdAt: new Date().toISOString(),
          sourceType,
          records
        }
      : undefined,
    errors
  };
}

export function exportEvaluationJson(result: ModelEvaluationResult) {
  downloadFile(
    `evaluation-${result.id}.json`,
    JSON.stringify(result, null, 2),
    "application/json"
  );
}

export function exportEvaluationCsv(result: ModelEvaluationResult) {
  const header = ["recordId", "expectedSentiment", "predictedSentiment", "confidence", "correct", "text"];
  const rows = result.predictions.map((prediction) => [
    prediction.recordId,
    prediction.expectedSentiment,
    prediction.predictedSentiment,
    String(prediction.confidence),
    String(prediction.correct),
    prediction.text
  ]);
  const csv = [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  downloadFile(`evaluation-predictions-${result.id}.csv`, csv, "text/csv");
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === "\"" && quoted && nextCharacter === "\"") {
      current += "\"";
      index += 1;
      continue;
    }

    if (character === "\"") {
      quoted = !quoted;
      continue;
    }

    if (character === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current);
  return cells;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function findHeaderIndex(header: string[], aliases: string[]) {
  return header.findIndex((cell) => aliases.includes(cell));
}

function normalizeSentiment(value?: string): SentimentLabel | undefined {
  const normalized = value?.trim().toLowerCase();
  return SENTIMENT_LABELS.find((label) => label === normalized);
}

function hashText(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  return value;
}

function downloadFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
