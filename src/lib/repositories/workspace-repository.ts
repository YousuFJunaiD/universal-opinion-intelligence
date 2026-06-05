import type { Workspace, WorkspaceMember, WorkspaceRole } from "@/types/workspace";

const WORKSPACES_KEY = "uoip.workspaces.v1";
const MEMBERS_KEY = "uoip.workspace-members.v1";
export const PERSONAL_WORKSPACE_ID = "personal";
export const ACTIVE_WORKSPACE_KEY = "uoip.active-workspace-id";

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (canUseStorage()) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

export function readWorkspaces(): Workspace[] {
  return readJson<Workspace[]>(WORKSPACES_KEY, []);
}

export function saveWorkspace(workspace: Workspace) {
  writeJson(WORKSPACES_KEY, [workspace, ...readWorkspaces()]);
  return workspace;
}

export function readWorkspaceMembers(): WorkspaceMember[] {
  return readJson<WorkspaceMember[]>(MEMBERS_KEY, []);
}

export function findWorkspaceMembers(workspaceId: string) {
  return readWorkspaceMembers().filter((member) => member.workspaceId === workspaceId);
}

export function saveWorkspaceMember(member: WorkspaceMember) {
  const members = readWorkspaceMembers().filter(
    (item) => !(item.workspaceId === member.workspaceId && item.userId === member.userId)
  );
  writeJson(MEMBERS_KEY, [member, ...members]);
  return member;
}

export function updateWorkspaceMemberRole(memberId: string, role: WorkspaceRole) {
  const members = readWorkspaceMembers();
  const nextMembers = members.map((member) => (member.id === memberId ? { ...member, role } : member));
  writeJson(MEMBERS_KEY, nextMembers);
  return nextMembers.find((member) => member.id === memberId);
}

export function deleteWorkspaceMember(memberId: string) {
  writeJson(MEMBERS_KEY, readWorkspaceMembers().filter((member) => member.id !== memberId));
}

export function getActiveWorkspaceId() {
  if (!canUseStorage()) {
    return PERSONAL_WORKSPACE_ID;
  }
  return window.localStorage.getItem(ACTIVE_WORKSPACE_KEY) ?? PERSONAL_WORKSPACE_ID;
}

export function setActiveWorkspaceId(workspaceId: string) {
  if (canUseStorage()) {
    window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
    window.dispatchEvent(new Event("uoip-active-workspace-changed"));
  }
}
