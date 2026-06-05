"use client";

import {
  createProject as createProjectApi,
  deleteProject as deleteProjectApi,
  getProjectById as getProjectByIdApi,
  getProjects as getProjectsApi,
  updateProject as updateProjectApi
} from "@/lib/api/client";
import { DATA_MODE, runApiShadowCall } from "@/lib/data-mode";
import { deleteProject, findProject, readProjects, saveProject, updateProject } from "@/lib/projects";
import { clearAnalysisDataForNewDataset } from "@/lib/data-services/analysis-data-service";
import { clearReportData } from "@/lib/data-services/report-data-service";
import { deleteDatasetByProjectId } from "@/lib/repositories/dataset-repository";
import { getActiveWorkspaceId, PERSONAL_WORKSPACE_ID } from "@/lib/data-services/workspace-data-service";
import type { ProjectCreateRequest, ProjectUpdateRequest } from "@/types/api";
import type { OpinionProject } from "@/types/project";

export async function createProjectData(input: ProjectCreateRequest): Promise<OpinionProject> {
  const activeWorkspaceId = input.workspaceId ?? getActiveWorkspaceId();
  const workspaceId = activeWorkspaceId === PERSONAL_WORKSPACE_ID ? undefined : activeWorkspaceId;
  const project: OpinionProject = {
    id: input.id ?? crypto.randomUUID(),
    name: input.name,
    analysisType: input.analysisType,
    dataSource: input.dataSource,
    goal: input.goal,
    status: "Draft",
    createdAt: new Date().toISOString(),
    workspaceId
  };

  if (DATA_MODE === "api") {
    const response = await createProjectApi({ ...input, id: project.id, workspaceId });
    return {
      id: response.id ?? project.id,
      name: response.name ?? project.name,
      analysisType: response.analysisType ?? project.analysisType,
      dataSource: response.dataSource ?? project.dataSource,
      goal: response.goal ?? project.goal,
      status: response.status ?? project.status,
      createdAt: project.createdAt,
      workspaceId: response.workspaceId
    };
  }

  saveProject(project);
  runApiShadowCall(() => createProjectApi({ ...input, id: project.id, workspaceId }));
  return project;
}

export async function listProjectData() {
  if (DATA_MODE === "api") {
    return (await getProjectsApi()).projects;
  }

  const activeWorkspaceId = getActiveWorkspaceId();
  return readProjects().filter((project) =>
    activeWorkspaceId === PERSONAL_WORKSPACE_ID ? !project.workspaceId : project.workspaceId === activeWorkspaceId
  );
}

export async function getProjectDataById(projectId: string) {
  if (DATA_MODE === "api") {
    return (await getProjectByIdApi(projectId)).project;
  }

  return findProject(projectId) ?? null;
}

export async function updateProjectData(projectId: string, updates: ProjectUpdateRequest) {
  if (DATA_MODE === "api") {
    await updateProjectApi(projectId, updates);
    return;
  }

  updateProject(projectId, updates);
  runApiShadowCall(() => updateProjectApi(projectId, updates));
}

export async function deleteProjectData(projectId: string) {
  if (DATA_MODE === "api") {
    await deleteProjectApi(projectId);
    return;
  }

  deleteProject(projectId);
  deleteDatasetByProjectId(projectId);
  await clearAnalysisDataForNewDataset(projectId);
  await clearReportData(projectId);
  runApiShadowCall(() => deleteProjectApi(projectId));
}

export function isApiDataMode() {
  return DATA_MODE === "api";
}
