import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Building2, FolderKanban, MessageSquarePlus, Settings } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ApiDiagnosticsPanel } from "@/components/api-diagnostics-panel";
import { DataModeStatus } from "@/components/data-mode-status";
import { SidebarAuthStatus } from "@/components/sidebar-auth-status";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { DATA_MODE } from "@/lib/data-mode";
import { getAuthMode, isSupabaseAuthMode } from "@/server/auth/auth-mode";
import { getCurrentUser } from "@/server/auth/get-current-user";

const navItems = [
  { href: "/dashboard", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/onboarding", label: "New project", icon: MessageSquarePlus },
  { href: "/dashboard/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/dashboard/evaluation", label: "Evaluation", icon: BarChart3 },
  { href: "#", label: "Settings", icon: Settings }
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authMode = getAuthMode();
  const shouldRequireSession = DATA_MODE === "api" && isSupabaseAuthMode();
  const currentUser = shouldRequireSession || authMode === "dev" ? await getCurrentUser() : null;

  if (shouldRequireSession && !currentUser) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b bg-white/82 px-5 py-5 backdrop-blur lg:min-h-screen lg:border-b-0 lg:border-r">
        <BrandMark />
        <nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col">
          {navItems.map((item) => (
            <Link
              className="flex h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              href={item.href}
              key={item.label}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <WorkspaceSwitcher />
        <SidebarAuthStatus authMode={authMode} user={currentUser} />
        <DataModeStatus />
        <ApiDiagnosticsPanel />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
