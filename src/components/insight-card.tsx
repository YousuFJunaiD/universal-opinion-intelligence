import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  tone?: "positive" | "negative" | "neutral" | "warning";
}

const toneClasses = {
  positive: "bg-teal-50 text-teal-700 border-teal-100",
  negative: "bg-red-50 text-red-700 border-red-100",
  neutral: "bg-slate-50 text-slate-700 border-slate-100",
  warning: "bg-amber-50 text-amber-800 border-amber-100"
};

export function InsightCard({
  description,
  icon: Icon,
  label,
  tone = "neutral",
  value
}: InsightCardProps) {
  return (
    <div className="rounded-md border bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-md border", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
