import Link from "next/link";
import { ArrowRight, BarChart3, Database, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const capabilities = [
  {
    title: "Chat-first setup",
    description: "Guide every analysis project through a clear conversation before data processing begins.",
    icon: ArrowRight
  },
  {
    title: "Ready for real pipelines",
    description: "Project structure anticipates ingestion, ML services, and PostgreSQL-backed persistence.",
    icon: Database
  },
  {
    title: "Decision-focused output",
    description: "The product is organized around goals like reputation, complaints, crisis risk, and growth.",
    icon: BarChart3
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <BrandMark />
        <nav className="flex items-center gap-2">
          <Link
            className="hidden h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            href="/login"
          >
            Log in
          </Link>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-md border bg-white px-3 py-1 text-sm font-semibold text-slate-600">
            Phase 0 and Phase 1 foundation
          </p>
          <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-normal text-slate-950 md:text-6xl">
            Universal Opinion Intelligence Platform
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            A production-oriented workspace for planning sentiment, emotion, stance, aspect, risk, and recommendation analysis across text datasets.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-11 px-5">
              <Link href="/dashboard/onboarding">
                Start analysis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-5">
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
        </div>

        <Card className="p-5">
          <div className="rounded-md border bg-slate-950 p-4 text-white">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm font-semibold text-teal-200">Project intake</span>
              <ShieldCheck className="h-5 w-5 text-amber-300" />
            </div>
            <div className="space-y-3">
              <div className="max-w-[86%] rounded-md bg-white/10 p-3 text-sm text-slate-100">
                What do you want to analyse?
              </div>
              <div className="ml-auto max-w-[80%] rounded-md bg-teal-400 p-3 text-sm font-semibold text-teal-950">
                Product reviews for complaint detection
              </div>
              <div className="max-w-[90%] rounded-md bg-white/10 p-3 text-sm text-slate-100">
                Great. I will create a draft project and prepare the dataset intake.
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 md:grid-cols-3">
        {capabilities.map((item) => (
          <Card key={item.title} className="p-5">
            <item.icon className="mb-5 h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-slate-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
