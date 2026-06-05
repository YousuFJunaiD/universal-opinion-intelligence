import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  Globe2,
  Layers3,
  LineChart,
  LockKeyhole,
  MessageSquareText,
  PieChart,
  Search,
  ShieldCheck,
  Sparkles,
  Upload
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const valueCards = [
  {
    title: "Analyse opinion datasets",
    description: "Bring in reviews, comments, survey responses, public pages, or manually curated text and convert them into structured evidence.",
    icon: MessageSquareText
  },
  {
    title: "Run transparent models",
    description: "Use a deterministic rule-based baseline, FastAPI ML adapter, or future production models without changing the product workflow.",
    icon: BrainCircuit
  },
  {
    title: "Generate decision reports",
    description: "Create report snapshots with sentiment, emotion, stance, aspects, risks, recommendations, and export-ready evidence.",
    icon: FileText
  }
];

const workflow = [
  {
    label: "Plan",
    title: "Define the research intent",
    description: "Choose topic, brand, product, profile, campaign, public question, or custom dataset.",
    icon: ClipboardList
  },
  {
    label: "Collect",
    title: "Add public or owned text",
    description: "Paste text, upload CSV, add URLs, or use configured public search providers.",
    icon: Upload
  },
  {
    label: "Analyse",
    title: "Prepare and evaluate signals",
    description: "Clean records, run sentiment, deep analysis, risk signals, and evidence-linked recommendations.",
    icon: BarChart3
  },
  {
    label: "Report",
    title: "Publish a defensible snapshot",
    description: "Generate a structured report with charts, limitations, model metadata, and print-ready export.",
    icon: FileText
  }
];

const analysisTypes = [
  "Social media profiles",
  "Brand reputation",
  "Product reviews",
  "Public opinion",
  "Campaign response",
  "Customer support",
  "Survey feedback",
  "Custom text"
];

const enterpriseCapabilities = [
  {
    title: "PostgreSQL-ready data layer",
    description: "Mode-based services support localStorage, API shadow mode, and API-backed persistence.",
    icon: Database
  },
  {
    title: "User and workspace scope",
    description: "Auth-aware API mode keeps projects and datasets scoped to the right owner or workspace.",
    icon: LockKeyhole
  },
  {
    title: "Public research guardrails",
    description: "Search and URL ingestion record source limitations and avoid hidden or private data claims.",
    icon: ShieldCheck
  },
  {
    title: "Model adapter architecture",
    description: "Rule-based, FastAPI, and future provider paths share clean contracts and model metadata.",
    icon: Layers3
  }
];

const dashboardMetrics = [
  { label: "Positive", value: "42%", tone: "bg-teal-500" },
  { label: "Neutral", value: "38%", tone: "bg-blue-500" },
  { label: "Negative", value: "20%", tone: "bg-amber-500" }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <header className="border-b bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <BrandMark />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/dashboard">View dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Enterprise opinion intelligence for research-grade reporting
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-normal text-slate-950 md:text-6xl">
              Universal Opinion Intelligence Platform
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A chat-first SaaS workspace for collecting public or owned text, analysing opinion signals, and producing evidence-backed reports for brands, products, profiles, campaigns, and research topics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-11 px-5">
                <Link href="/dashboard/onboarding">
                  Start guided analysis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-5">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="ghost" className="h-11 px-5">
                <Link href="/dashboard">View dashboard</Link>
              </Button>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 text-sm font-medium text-slate-600 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                No fake analysis
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                Source limitations tracked
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                ML adapter ready
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border bg-slate-950 p-4 shadow-soft">
              <div className="rounded-md border border-white/10 bg-white p-4 text-slate-950">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="text-sm font-bold">Opinion Command Center</p>
                    <p className="text-xs font-medium text-slate-500">Live project snapshot</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
                    <LineChart className="h-4 w-4" />
                  </div>
                </div>

                <div className="grid gap-3 py-4 sm:grid-cols-3">
                  {dashboardMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-md border bg-slate-50 p-3">
                      <div className={`mb-3 h-1.5 rounded-full ${metric.tone}`} />
                      <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-950">{metric.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-md border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold">Signal mix</p>
                      <PieChart className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-3">
                      {["Emotion", "Stance", "Risk", "Aspects"].map((item, index) => (
                        <div key={item}>
                          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
                            <span>{item}</span>
                            <span>{72 - index * 11}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${72 - index * 11}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold">Evidence queue</p>
                      <Search className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-3">
                      {[
                        "Extracted public source limitations",
                        "Top negative records for review",
                        "Recommendation priority map"
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700">
                          <CheckCircle2 className="h-4 w-4 flex-none text-teal-600" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-normal text-primary">What it does</p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
            Turns unstructured opinions into defensible intelligence.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {valueCards.map((item) => (
            <Card key={item.title} className="p-5">
              <item.icon className="mb-5 h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-normal text-primary">Research-to-report workflow</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
                From guided intent to export-ready report.
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/onboarding">
                Open wizard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((step) => (
              <div key={step.label} className="rounded-lg border bg-slate-50 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm">
                    {step.label}
                  </span>
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-normal text-primary">Supported analysis types</p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
            Built for more than product reviews.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            The platform works with user-provided or publicly accessible text. It does not claim private, hidden, or unavailable data was analysed.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {analysisTypes.map((type) => (
            <div key={type} className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm">
              <Globe2 className="h-4 w-4 flex-none text-primary" />
              <span className="text-sm font-semibold text-slate-700">{type}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-teal-200">Enterprise capabilities</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">
              Architecture that can move from demo to governed deployment.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {enterpriseCapabilities.map((item) => (
              <div key={item.title} className="rounded-lg border border-white/10 bg-white/5 p-5">
                <item.icon className="mb-5 h-5 w-5 text-amber-300" />
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-lg border bg-white p-6 shadow-soft md:flex md:items-center md:justify-between md:gap-8">
          <div className="max-w-2xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-normal text-slate-950 md:text-3xl">
              Start with a guided project, then scale into API-backed intelligence.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use local mode for evaluation, API mode for PostgreSQL-backed workflows, and FastAPI provider mode when your ML service is ready.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0 md:flex-none">
            <Button asChild>
              <Link href="/signup">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
