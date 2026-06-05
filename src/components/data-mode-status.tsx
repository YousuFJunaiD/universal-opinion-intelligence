"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { DATA_MODE, type DataMode } from "@/lib/data-mode";
import { getApiHealth } from "@/lib/api/client";

type ApiHealth = "checking" | "available" | "unavailable";
type DevUser = { email: string; id: string } | null;

export function DataModeStatus() {
  const [apiHealth, setApiHealth] = useState<ApiHealth>("checking");
  const [authMode, setAuthMode] = useState("dev");
  const [currentUser, setCurrentUser] = useState<DevUser>(null);
  const [mode, setMode] = useState<DataMode>(DATA_MODE);

  useEffect(() => {
    let mounted = true;

    getApiHealth()
      .then((response) => {
        if (!mounted) {
          return;
        }

        setMode(response.mode);
        setAuthMode(response.authMode);
        setCurrentUser(response.currentUser ?? null);
        setApiHealth(response.status);
      })
      .catch(() => {
        if (mounted) {
          setApiHealth("unavailable");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mt-6 rounded-md border bg-slate-50 p-3 text-xs text-slate-600">
      <div className="flex items-center gap-2 font-bold text-slate-800">
        <Activity className="h-3.5 w-3.5 text-primary" />
        Data mode
      </div>
      <div className="mt-2 grid gap-1">
        <p>
          Current: <span className="font-bold">{mode}</span>
        </p>
        <p>
          API health: <span className="font-bold">{apiHealth}</span>
        </p>
        <p>
          Auth mode: <span className="font-bold">{authMode}</span>
        </p>
        {currentUser ? (
          <p>
            Dev user: <span className="font-bold">{currentUser.email}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
