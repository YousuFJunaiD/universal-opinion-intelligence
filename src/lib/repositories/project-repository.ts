import type { AnalysisType, OpinionProject, ProjectGoal, ProjectStatus } from "@/types/project";

const STORAGE_KEY = "uoip.projects.v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function writeProjects(projects: OpinionProject[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function readProjects(): OpinionProject[] {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProject(project: OpinionProject) {
  const projects = readProjects();
  writeProjects([project, ...projects]);
}

export function findProject(projectId: string) {
  return readProjects().find((project) => project.id === projectId);
}

export function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const projects = readProjects();
  const nextProjects = projects.map((project) =>
    project.id === projectId ? { ...project, status } : project
  );
  writeProjects(nextProjects);
  return nextProjects.find((project) => project.id === projectId);
}

export function updateProject(
  projectId: string,
  updates: { analysisType?: AnalysisType; goal?: ProjectGoal; name?: string }
) {
  const projects = readProjects();
  const nextProjects = projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          analysisType: updates.analysisType ?? project.analysisType,
          goal: updates.goal ?? project.goal,
          name: updates.name?.trim() || project.name
        }
      : project
  );
  writeProjects(nextProjects);
  return nextProjects.find((project) => project.id === projectId);
}

export function deleteProject(projectId: string) {
  writeProjects(readProjects().filter((project) => project.id !== projectId));
}
