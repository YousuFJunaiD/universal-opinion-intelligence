export type AnalysisType =
  | "Person/Profile"
  | "Brand"
  | "Product"
  | "Political/Public Opinion"
  | "Reviews"
  | "Custom Text";

export type DataSource = "Upload CSV" | "Paste Text" | "API later";

export type ProjectGoal =
  | "Reputation"
  | "Growth"
  | "Complaint detection"
  | "Audience understanding"
  | "Crisis risk"
  | "Product improvement";

export type ProjectStatus = "Draft" | "Data Added" | "Ready for Analysis" | "Analysed" | "Report Ready";

export interface OpinionProject {
  id: string;
  name: string;
  analysisType: AnalysisType;
  dataSource: DataSource;
  goal: ProjectGoal;
  status: ProjectStatus;
  createdAt: string;
  workspaceId?: string;
}
