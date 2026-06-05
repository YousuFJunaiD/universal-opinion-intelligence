export type WorkspaceRole = "owner" | "admin" | "analyst" | "viewer";

export type ProjectAccessLevel = "owner" | "edit" | "view";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  role: WorkspaceRole;
  createdAt: string;
}
