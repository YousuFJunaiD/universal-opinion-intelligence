import { SHOWCASE_MAX_INPUT_CHARS, SHOWCASE_MAX_RECORDS, SHOWCASE_MAX_RECORD_CHARS } from "./showcase-config";

export interface ShowcaseInputRecord {
  id: string;
  sourceRecordId?: string;
  text: string;
  source?: string;
}

const TEXT_HEADERS = ["text", "review", "comment", "content", "feedback", "feedback_text"];

/** Small, bounded CSV/text intake. IDs identify rows even when source IDs repeat. */
export function parseShowcaseInput(input: string, requireCsv = false): ShowcaseInputRecord[] {
  if (input.length > SHOWCASE_MAX_INPUT_CHARS) {
    throw new Error(`Showcase input is limited to ${SHOWCASE_MAX_INPUT_CHARS.toLocaleString()} characters.`);
  }
  const trimmed = input.trim();
  if (!trimmed) return [];
  const firstLine = trimmed.split(/\r?\n/, 1)[0];
  const possibleHeader = firstLine.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "").toLowerCase());
  const isCsv = requireCsv || possibleHeader.some((cell) => TEXT_HEADERS.includes(cell));
  let records: ShowcaseInputRecord[];

  if (isCsv) {
    const rows = parseShowcaseCsv(trimmed);
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const textIndex = headers.findIndex((header) => TEXT_HEADERS.includes(header));
    if (textIndex < 0) throw new Error("CSV needs a text, review, comment, content, feedback, or feedback_text column.");
    if (headers.filter((header) => TEXT_HEADERS.includes(header)).length !== 1) throw new Error("CSV must have exactly one supported text column.");
    const idIndex = headers.findIndex((header) => ["id", "record_id", "recordid", "response_id"].includes(header));
    const sourceIndex = headers.findIndex((header) => ["source", "platform", "type"].includes(header));
    records = rows.slice(1).map((row, index) => {
      if (row.length !== headers.length) throw new Error(`CSV row ${index + 2} has an unexpected column count. Quote text containing commas.`);
      return {
        id: `row-${index + 1}`,
        sourceRecordId: idIndex >= 0 ? row[idIndex].trim() || undefined : undefined,
        text: row[textIndex].trim(),
        source: sourceIndex >= 0 ? row[sourceIndex].trim() : "csv"
      };
    }).filter((record) => record.text.length > 0);
  } else {
    records = trimmed.split(/\r?\n/).map((text, index) => ({ id: `row-${index + 1}`, text: text.trim(), source: "pasted" })).filter((record) => record.text.length > 0);
  }

  if (records.length > SHOWCASE_MAX_RECORDS) throw new Error(`Use at most ${SHOWCASE_MAX_RECORDS} records for the browser showcase.`);
  if (records.some((record) => record.text.length > SHOWCASE_MAX_RECORD_CHARS)) throw new Error(`Each record must be at most ${SHOWCASE_MAX_RECORD_CHARS.toLocaleString()} characters.`);
  return records;
}

export function parseShowcaseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') { quoted = false; closedQuote = true; }
      else cell += char;
    } else if (char === "," || char === "\r" || char === "\n") {
      row.push(cell); cell = ""; closedQuote = false;
      if (char !== ",") {
        if (char === "\r" && input[i + 1] === "\n") i += 1;
        if (row.some((value) => value.trim())) rows.push(row);
        row = [];
      }
    } else if (char === '"' && !cell.trim() && !closedQuote) {
      cell = ""; quoted = true;
    } else if ((closedQuote && char.trim()) || char === '"') {
      throw new Error("Malformed CSV quoting. Use doubled quotes inside quoted text.");
    } else { cell += char; }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}
