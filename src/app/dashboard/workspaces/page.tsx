"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createWorkspaceData,
  listWorkspaceData,
  setActiveWorkspaceId
} from "@/lib/data-services/workspace-data-service";
import type { Workspace } from "@/types/workspace";

export default function WorkspacesPage() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    void listWorkspaceData().then(setWorkspaces).catch(() => setWorkspaces([]));
  }, []);

  async function handleCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const workspace = await createWorkspaceData(name.trim());
      setActiveWorkspaceId(workspace.id);
      setName("");
      setWorkspaces(await listWorkspaceData());
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create workspace.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="border-b pb-6">
        <p className="text-sm font-semibold text-primary">Shared workspaces</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Workspaces</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Create a workspace to share projects with analysts and viewers.
        </p>
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-950">Create workspace</h2>
          <form className="mt-5 space-y-4" onSubmit={handleCreateWorkspace}>
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input id="workspace-name" onChange={(event) => setName(event.target.value)} required value={name} />
            </div>
            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
            <Button disabled={isSubmitting || !name.trim()} type="submit">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create workspace
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-950">Your workspaces</h2>
          <div className="mt-5 grid gap-3">
            {workspaces.length === 0 ? (
              <p className="rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                No shared workspaces yet.
              </p>
            ) : (
              workspaces.map((workspace) => (
                <div className="flex items-center justify-between rounded-md border bg-white p-4" key={workspace.id}>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-bold text-slate-950">{workspace.name}</p>
                      <p className="text-xs font-semibold text-slate-500">Workspace project scope</p>
                    </div>
                  </div>
                  <Button onClick={() => setActiveWorkspaceId(workspace.id)} variant="outline">
                    Use workspace
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
