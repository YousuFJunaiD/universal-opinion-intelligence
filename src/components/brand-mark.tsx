import { MessageSquareText } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
        <MessageSquareText className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold leading-4 text-slate-950">Universal Opinion</p>
        <p className="text-xs font-medium text-slate-500">Intelligence Platform</p>
      </div>
    </div>
  );
}
