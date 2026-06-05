import { z } from "zod";

const analysisTypeSchema = z.enum([
  "Person/Profile",
  "Brand",
  "Product",
  "Political/Public Opinion",
  "Reviews",
  "Custom Text"
]);

const dataSourceSchema = z.enum(["Upload CSV", "Paste Text", "API later"]);
const projectGoalSchema = z.enum([
  "Reputation",
  "Growth",
  "Complaint detection",
  "Audience understanding",
  "Crisis risk",
  "Product improvement"
]);
const dataSourceTypeSchema = z.enum(["paste_text", "csv_upload"]);
const workspaceRoleSchema = z.enum(["owner", "admin", "analyst", "viewer"]);
const sentimentLabelSchema = z.enum(["positive", "negative", "neutral"]);

export const projectCreateRequestSchema = z.object({
  id: z.string().min(1).optional(),
  analysisType: analysisTypeSchema,
  dataSource: dataSourceSchema,
  goal: projectGoalSchema,
  name: z.string().trim().min(1),
  workspaceId: z.string().min(1).optional()
});

export const projectUpdateRequestSchema = z.object({
  analysisType: analysisTypeSchema.optional(),
  goal: projectGoalSchema.optional(),
  name: z.string().trim().min(1).optional()
});

export const datasetCreateRequestSchema = z.object({
  columns: z.array(z.string()).optional(),
  fileName: z.string().optional(),
  id: z.string().min(1).optional(),
  projectId: z.string().min(1),
  records: z.array(z.string()).min(1),
  selectedColumn: z.string().optional(),
  sourceType: dataSourceTypeSchema
});

export const analysisPrepareRequestSchema = z.object({
  datasetId: z.string().min(1),
  projectId: z.string().min(1)
});

export const analysisRunRequestSchema = z.object({
  analysisResultId: z.string().min(1).optional(),
  datasetId: z.string().min(1),
  preparedDatasetId: z.string().min(1).optional(),
  projectId: z.string().min(1)
});

export const reportCreateRequestSchema = z.object({
  analysisResultId: z.string().min(1),
  datasetId: z.string().min(1),
  multiDimensionalAnalysisResultId: z.string().min(1).optional(),
  preparedDatasetId: z.string().min(1),
  projectId: z.string().min(1),
  recommendationResultId: z.string().min(1).optional()
});

export const reportExportCreateRequestSchema = z.object({
  exportId: z.string().min(1),
  exportedAt: z.string().min(1),
  exportType: z.literal("pdf-print"),
  projectId: z.string().min(1),
  reportSnapshotId: z.string().min(1)
});

export const workspaceCreateRequestSchema = z.object({
  name: z.string().trim().min(1)
});

export const workspaceMemberCreateRequestSchema = z.object({
  email: z.string().trim().email(),
  role: workspaceRoleSchema,
  userId: z.string().min(1).optional()
});

export const workspaceMemberUpdateRequestSchema = z.object({
  role: workspaceRoleSchema
});

export const evaluationRunRequestSchema = z.object({
  dataset: z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    createdAt: z.string().min(1),
    sourceType: z.enum(["paste", "csv"]),
    records: z.array(
      z.object({
        id: z.string().min(1),
        text: z.string().trim().min(1),
        expectedSentiment: sentimentLabelSchema
      })
    ).min(1)
  })
});

export async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    message: issue.message,
    path: issue.path.join(".")
  }));
}
