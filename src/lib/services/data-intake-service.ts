import type { Dataset, DatasetRecord, DataSourceType } from "@/types/dataset";

export interface CsvParseResult {
  columns: string[];
  rows: Record<string, string>[];
}

export interface IntakeValidation {
  errors: string[];
  warnings: string[];
}

export function buildPasteTextDataset(projectId: string, rawText: string): Dataset {
  const createdAt = new Date().toISOString();
  const records = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, index) => createRecord(text, "paste_text", createdAt, index));

  return {
    id: crypto.randomUUID(),
    projectId,
    sourceType: "paste_text",
    createdAt,
    recordCount: records.length,
    records
  };
}

export function buildCsvDataset({
  columns,
  fileName,
  projectId,
  rows,
  selectedColumn
}: {
  columns: string[];
  fileName: string;
  projectId: string;
  rows: Record<string, string>[];
  selectedColumn: string;
}): Dataset {
  const createdAt = new Date().toISOString();
  const records = rows
    .map((row, index) => ({
      metadata: row,
      rowIndex: index,
      text: String(row[selectedColumn] ?? "").trim()
    }))
    .filter((row) => row.text.length > 0)
    .map((row) =>
      createRecord(row.text, "csv_upload", createdAt, row.rowIndex, row.metadata)
    );

  return {
    id: crypto.randomUUID(),
    projectId,
    sourceType: "csv_upload",
    createdAt,
    recordCount: records.length,
    records,
    fileName,
    selectedColumn,
    columns
  };
}

export function validateDataset(dataset: Dataset): IntakeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (dataset.records.length === 0) {
    errors.push("Add at least one non-empty text record before saving.");
  }

  if (dataset.records.length > 0 && dataset.records.length < 5) {
    warnings.push("Minimum 5 records recommended for useful analysis later.");
  }

  return { errors, warnings };
}

export function parseCsv(csvText: string): CsvParseResult {
  const parsedRows = parseCsvRows(csvText).filter((row) =>
    row.some((cell) => cell.trim().length > 0)
  );

  if (parsedRows.length === 0) {
    return { columns: [], rows: [] };
  }

  const columns = normalizeHeaders(parsedRows[0]);
  const rows = parsedRows.slice(1).map((row) =>
    columns.reduce<Record<string, string>>((record, column, index) => {
      record[column] = row[index]?.trim() ?? "";
      return record;
    }, {})
  );

  return { columns, rows };
}

function createRecord(
  text: string,
  sourceType: DataSourceType,
  createdAt: string,
  rowIndex: number,
  metadata?: Record<string, string>
): DatasetRecord {
  return {
    id: crypto.randomUUID(),
    text,
    sourceType,
    createdAt,
    rowIndex,
    metadata
  };
}

function normalizeHeaders(headers: string[]) {
  const seen = new Map<string, number>();

  return headers.map((header, index) => {
    const fallback = `Column ${index + 1}`;
    const baseName = header.trim() || fallback;
    const count = seen.get(baseName) ?? 0;
    seen.set(baseName, count + 1);
    return count === 0 ? baseName : `${baseName} ${count + 1}`;
  });
}

function parseCsvRows(input: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";

      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  rows.push(currentRow);
  return rows;
}
