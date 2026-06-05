"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, FileUp, Save, TableProperties } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  buildCsvDataset,
  buildPasteTextDataset,
  parseCsv,
  validateDataset,
  type CsvParseResult
} from "@/lib/services/data-intake-service";
import { saveDataset } from "@/lib/repositories/dataset-repository";
import type { Dataset } from "@/types/dataset";

type IntakeMode = "paste" | "csv";

interface DataIntakePanelProps {
  dataset?: Dataset | null;
  onDatasetSaved: (dataset: Dataset) => void;
  persistDataset?: (dataset: Dataset) => Dataset | Promise<Dataset>;
  projectId: string;
  savedLabel?: string;
}

export function DataIntakePanel({
  dataset,
  onDatasetSaved,
  persistDataset = saveDataset,
  projectId,
  savedLabel = "Dataset saved locally"
}: DataIntakePanelProps) {
  const [mode, setMode] = useState<IntakeMode>("paste");
  const [pasteText, setPasteText] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [csvData, setCsvData] = useState<CsvParseResult>({ columns: [], rows: [] });
  const [selectedColumn, setSelectedColumn] = useState("");
  const [fileError, setFileError] = useState("");

  const draftDataset = useMemo(() => {
    if (mode === "paste") {
      return buildPasteTextDataset(projectId, pasteText);
    }

    if (!selectedColumn) {
      return null;
    }

    return buildCsvDataset({
      columns: csvData.columns,
      fileName: csvFileName,
      projectId,
      rows: csvData.rows,
      selectedColumn
    });
  }, [csvData.columns, csvData.rows, csvFileName, mode, pasteText, projectId, selectedColumn]);

  const validation = draftDataset ? validateDataset(draftDataset) : { errors: [], warnings: [] };
  const previewRecords = draftDataset?.records.slice(0, 8) ?? [];
  const canSave = Boolean(draftDataset && validation.errors.length === 0);

  async function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileError("");
    setCsvFileName("");
    setCsvData({ columns: [], rows: [] });
    setSelectedColumn("");

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Upload a CSV file.");
      return;
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    setCsvFileName(file.name);
    setCsvData(parsed);
    setSelectedColumn(detectTextColumn(parsed.columns));

    if (parsed.columns.length === 0) {
      setFileError("No columns were detected in this CSV.");
    }
  }

  async function handleSave() {
    if (!draftDataset || validation.errors.length > 0) {
      return;
    }

    const savedDataset = await persistDataset(draftDataset);
    onDatasetSaved(savedDataset);
  }

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold text-primary">Phase 2</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Data Intake</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Add raw text records to this project. Analysis models are intentionally not connected yet.
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
            {draftDataset?.recordCount ?? 0} records
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
          <ModeButton active={mode === "paste"} label="Paste Text" onClick={() => setMode("paste")} />
          <ModeButton active={mode === "csv"} label="Upload CSV" onClick={() => setMode("csv")} />
        </div>

        {mode === "paste" ? (
          <div className="mt-5 space-y-3">
            <Label htmlFor="paste-text">Paste comments, reviews, or posts</Label>
            <Textarea
              id="paste-text"
              onChange={(event) => setPasteText(event.target.value)}
              placeholder={"One record per line\nExample: Delivery was fast\nExample: Support did not respond"}
              value={pasteText}
            />
            <p className="text-xs font-medium text-slate-500">Each non-empty line becomes one dataset record.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="rounded-md border border-dashed bg-white p-5">
              <Label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center" htmlFor="csv-file">
                <FileUp className="h-6 w-6 text-primary" />
                <span>Upload CSV</span>
                <span className="text-xs font-medium text-slate-500">Columns will be detected automatically.</span>
              </Label>
              <input
                accept=".csv,text/csv"
                className="sr-only"
                id="csv-file"
                onChange={handleCsvUpload}
                type="file"
              />
              {csvFileName ? <p className="mt-4 text-center text-sm font-semibold text-slate-700">{csvFileName}</p> : null}
            </div>

            {csvData.columns.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="text-column">Text/comment/review column</Label>
                <select
                  className="h-11 w-full rounded-md border bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  id="text-column"
                  onChange={(event) => setSelectedColumn(event.target.value)}
                  value={selectedColumn}
                >
                  {csvData.columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
                <p className="text-xs font-medium text-slate-500">
                  Detected {csvData.columns.length} columns and {csvData.rows.length} data rows.
                </p>
              </div>
            ) : null}
          </div>
        )}

        <ValidationMessages errors={[fileError, ...validation.errors].filter(Boolean)} warnings={validation.warnings} />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button disabled={!canSave} onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save dataset
          </Button>
          {dataset ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
              <CheckCircle2 className="h-4 w-4" />
              {savedLabel}
            </span>
          ) : null}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Preview table</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review the records before saving. Empty records are removed.
            </p>
          </div>
          <TableProperties className="h-5 w-5 text-primary" />
        </div>
        <RecordsTable records={previewRecords} />
      </Card>
    </section>
  );
}

function ModeButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex h-10 items-center justify-center rounded-md text-sm font-bold text-slate-600 transition",
        active && "bg-white text-primary shadow-sm"
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ValidationMessages({ errors, warnings }: { errors: string[]; warnings: string[] }) {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-2">
      {errors.map((error) => (
        <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" key={error}>
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      ))}
      {warnings.map((warning) => (
        <p className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800" key={warning}>
          <AlertCircle className="h-4 w-4" />
          {warning}
        </p>
      ))}
    </div>
  );
}

function RecordsTable({ records }: { records: Dataset["records"] }) {
  if (records.length === 0) {
    return (
      <div className="mt-6 grid min-h-64 place-items-center rounded-md border bg-slate-50 p-8 text-center">
        <div>
          <ClipboardList className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-600">No records ready for preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-md border">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-20 px-4 py-3">No.</th>
            <th className="px-4 py-3">Text</th>
          </tr>
        </thead>
        <tbody className="divide-y bg-white">
          {records.map((record, index) => (
            <tr key={record.id}>
              <td className="px-4 py-3 font-semibold text-slate-500">{index + 1}</td>
              <td className="px-4 py-3 leading-6 text-slate-800">{record.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
        Showing first {records.length} records
      </div>
    </div>
  );
}

function detectTextColumn(columns: string[]) {
  const preferredNames = ["text", "comment", "review", "post", "feedback", "message", "content"];
  return (
    columns.find((column) =>
      preferredNames.some((name) => column.toLowerCase().includes(name))
    ) ?? columns[0] ?? ""
  );
}
