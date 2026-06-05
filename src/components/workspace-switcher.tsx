"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, Plus, Users } from "lucide-react";
import {
  getActiveWorkspaceId,
  listWorkspaceData,
  PERSONAL_WORKSPACE_ID,
  setActiveWorkspaceId
} from "@/lib/data-services/workspace-data-service";
import type { Workspace } from "@/types/workspace";

export function WorkspaceSwitcher() {
  const [activeWorkspaceId, setActiveWorkspaceState] = useState(PERSONAL_WORKSPACE_ID);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    setActiveWorkspaceState(getActiveWorkspaceId());
    void listWorkspaceData().then(setWorkspaces).catch(() => setWorkspaces([]));
  }, []);

  function handleChange(workspaceId: string) {
    setActiveWorkspaceId(workspaceId);
    setActiveWorkspaceState(workspaceId);
  }

  return (
    <div className="mt-6 rounded-md border bg-slate-50 p-3 text-xs text-slate-600">
      <div className="flex items-center gap-2 font-bold text-slate-800">
        <Building2 className="h-3.5 w-3.5 text-primary" />
        Workspace
      </div>
      <select
        className="mt-3 h-9 w-full rounded-md border bg-white px-2 text-xs font-semibold text-slate-800"
        onChange={(event) => handleChange(event.target.value)}
        value={activeWorkspaceId}
      >
        <option value={PERSONAL_WORKSPACE_ID}>Personal workspace</option>
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
      <div className="mt-3 grid gap-2">
        <Link className="inline-flex items-center gap-2 font-semibold text-primary" href="/dashboard/workspaces">
          <Plus className="h-3.5 w-3.5" />
          Create workspace
        </Link>
        {activeWorkspaceId !== PERSONAL_WORKSPACE_ID ? (
          <Link
            className="inline-flex items-center gap-2 font-semibold text-primary"
            href={`/dashboard/workspaces/${activeWorkspaceId}/members`}
          >
            <Users className="h-3.5 w-3.5" />
            Members
          </Link>
        ) : null}
      </div>
    </div>
  );
}
