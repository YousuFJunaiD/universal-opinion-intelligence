"use client";

import {
  addWorkspaceMember,
  createWorkspace,
  deleteWorkspaceMember,
  getWorkspaceMembers,
  getWorkspaces,
  updateWorkspaceMember
} from "@/lib/api/client";
import { DATA_MODE, runApiShadowCall } from "@/lib/data-mode";
import {
  findWorkspaceMembers,
  getActiveWorkspaceId,
  PERSONAL_WORKSPACE_ID,
  readWorkspaces,
  saveWorkspace,
  saveWorkspaceMember,
  setActiveWorkspaceId,
  updateWorkspaceMemberRole,
  deleteWorkspaceMember as deleteLocalWorkspaceMember
} from "@/lib/repositories/workspace-repository";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "@/types/workspace";

export { getActiveWorkspaceId, PERSONAL_WORKSPACE_ID, setActiveWorkspaceId };

export async function listWorkspaceData(): Promise<Workspace[]> {
  if (DATA_MODE === "api") {
    return (await getWorkspaces()).workspaces;
  }
  return readWorkspaces();
}

export async function createWorkspaceData(name: string) {
  if (DATA_MODE === "api") {
    return (await createWorkspace({ name })).workspace;
  }

  const workspace = saveWorkspace({
    id: crypto.randomUUID(),
    name,
    ownerId: "local-user",
    createdAt: new Date().toISOString()
  });
  saveWorkspaceMember({
    id: crypto.randomUUID(),
    workspaceId: workspace.id,
    userId: "local-user",
    email: "local@uoip.dev",
    role: "owner",
    createdAt: new Date().toISOString()
  });
  runApiShadowCall(() => createWorkspace({ name }));
  return workspace;
}

export async function listWorkspaceMembersData(workspaceId: string): Promise<WorkspaceMember[]> {
  if (DATA_MODE === "api") {
    return (await getWorkspaceMembers(workspaceId)).members;
  }
  return findWorkspaceMembers(workspaceId);
}

export async function addWorkspaceMemberData(workspaceId: string, input: { email: string; role: WorkspaceRole; userId?: string }) {
  if (DATA_MODE === "api") {
    return (await addWorkspaceMember(workspaceId, input)).members;
  }
  saveWorkspaceMember({
    id: crypto.randomUUID(),
    workspaceId,
    userId: input.userId || crypto.randomUUID(),
    email: input.email,
    role: input.role,
    createdAt: new Date().toISOString()
  });
  runApiShadowCall(() => addWorkspaceMember(workspaceId, input));
  return findWorkspaceMembers(workspaceId);
}

export async function updateWorkspaceMemberData(workspaceId: string, memberId: string, role: WorkspaceRole) {
  if (DATA_MODE === "api") {
    return (await updateWorkspaceMember(workspaceId, memberId, { role })).members;
  }
  updateWorkspaceMemberRole(memberId, role);
  runApiShadowCall(() => updateWorkspaceMember(workspaceId, memberId, { role }));
  return findWorkspaceMembers(workspaceId);
}

export async function deleteWorkspaceMemberData(workspaceId: string, memberId: string) {
  if (DATA_MODE === "api") {
    return (await deleteWorkspaceMember(workspaceId, memberId)).members;
  }
  deleteLocalWorkspaceMember(memberId);
  runApiShadowCall(() => deleteWorkspaceMember(workspaceId, memberId));
  return findWorkspaceMembers(workspaceId);
}
