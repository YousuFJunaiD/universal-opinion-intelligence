import { LogoutButton } from "@/components/logout-button";
import type { AuthMode, AuthUser } from "@/types/auth";

export function SidebarAuthStatus({ authMode, user }: { authMode: AuthMode; user: AuthUser | null }) {
  return (
    <div className="mt-6 rounded-md border bg-white p-3 text-xs text-slate-600">
      <p className="font-bold text-slate-800">Session</p>
      <p className="mt-2">
        Auth mode: <span className="font-bold">{authMode}</span>
      </p>
      <p className="mt-1 truncate">
        User: <span className="font-bold">{user?.email ?? "Not signed in"}</span>
      </p>
      {authMode === "supabase" && user ? <LogoutButton /> : null}
    </div>
  );
}
