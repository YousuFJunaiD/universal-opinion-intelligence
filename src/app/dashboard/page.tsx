"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isApiDataMode, listProjectData } from "@/lib/data-services/project-data-service";
import type { OpinionProject } from "@/types/project";

export default function DashboardPage() {
  const [projects, setProjects] = useState<OpinionProject[]>([]);
  const [isLoading, setIsLoading] = useState(isApiDataMode());
  const [error, setError] = useState("");

  useEffect(() => {
    void loadProjects();
  }, []);

  async function loadProjects() {
    setIsLoading(true);
    setError("");
    try {
      setProjects(await listProjectData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-primary">Main dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Opinion analysis projects</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Create and manage draft analysis projects before ingestion and ML services are connected.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/onboarding">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <section className="grid min-h-[58vh] place-items-center">
          <Card className="max-w-md p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <h2 className="mt-5 text-xl font-bold text-slate-950">Loading projects</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Fetching the current project list.</p>
          </Card>
        </section>
      ) : error ? (
        <section className="grid min-h-[58vh] place-items-center">
          <Card className="max-w-md p-8 text-center">
            <h2 className="text-xl font-bold text-slate-950">Failed to load projects</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
            <Button className="mt-6" onClick={loadProjects}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </Card>
        </section>
      ) : projects.length === 0 ? (
        <section className="grid min-h-[58vh] place-items-center">
          <Card className="max-w-xl p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">No projects yet</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Start with the chat onboarding flow to define what you want to analyse, where the data will come from, and the business goal.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/onboarding">Start onboarding</Link>
            </Button>
          </Card>
        </section>
      ) : (
        <section className="mt-8 grid gap-4 xl:grid-cols-2">
          {projects.map((project) => (
            <Link href={`/dashboard/projects/${project.id}`} key={project.id}>
              <Card className="p-5 transition hover:-translate-y-0.5 hover:border-primary/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">{project.name}</h2>
                    <p className="mt-2 text-sm text-slate-600">{project.analysisType}</p>
                  </div>
                  <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                    {project.status}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-slate-900">Source:</span> {project.dataSource}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Goal:</span> {project.goal}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Visibility:</span>{" "}
                    {project.workspaceId ? "Workspace" : "Personal"}
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">
                  View draft
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
