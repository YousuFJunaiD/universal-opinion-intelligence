import type { OpinionProject, ProjectStatus } from "@/types/project";
import {
  findProject,
  readProjects,
  saveProject,
  updateProjectStatus
} from "@/lib/repositories/project-repository";

export class LocalStorageProjectRepository {
  findById(projectId: string) {
    return findProject(projectId);
  }

  list(): OpinionProject[] {
    return readProjects();
  }

  save(project: OpinionProject) {
    saveProject(project);
    return project;
  }

  updateStatus(projectId: string, status: ProjectStatus) {
    return updateProjectStatus(projectId, status);
  }
}
