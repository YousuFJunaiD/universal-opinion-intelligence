export type DataSourceType = "paste_text" | "csv_upload";

export interface DatasetRecord {
  id: string;
  text: string;
  sourceType: DataSourceType;
  createdAt: string;
  rowIndex: number;
  metadata?: Record<string, string>;
}

export interface Dataset {
  id: string;
  projectId: string;
  sourceType: DataSourceType;
  createdAt: string;
  recordCount: number;
  records: DatasetRecord[];
  fileName?: string;
  selectedColumn?: string;
  columns?: string[];
}
