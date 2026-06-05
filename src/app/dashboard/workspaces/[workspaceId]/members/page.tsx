"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addWorkspaceMemberData,
  deleteWorkspaceMemberData,
  listWorkspaceMembersData,
  updateWorkspaceMemberData
} from "@/lib/data-services/workspace-data-service";
import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

const roles: WorkspaceRole[] = ["admin", "analyst", "viewer"];

export default function WorkspaceMembersPage() {
  const params = useParams<{ workspaceId: string }>();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [role, setRole] = useState<WorkspaceRole>("analyst");
  const [userId, setUserId] = useState("");

  const loadMembers = useCallback(async () => {
    setError("");
    try {
      setMembers(await listWorkspaceMembersData(params.workspaceId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load members.");
    }
  }, [params.workspaceId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      setMembers(
        await addWorkspaceMemberData(params.workspaceId, {
          email,
          role,
          userId: userId.trim() || undefined
        })
      );
      setEmail("");
      setUserId("");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Failed to add member.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRoleChange(memberId: string, nextRole: WorkspaceRole) {
    setMembers(await updateWorkspaceMemberData(params.workspaceId, memberId, nextRole));
  }

  async function handleDeleteMember(memberId: string) {
    if (!window.confirm("Remove this member from the workspace?")) {
      return;
    }
    setMembers(await deleteWorkspaceMemberData(params.workspaceId, memberId));
  }

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="border-b pb-6">
        <p className="text-sm font-semibold text-primary">Workspace access</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Members and roles</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Owners and admins can manage members. Analysts can edit analysis. Viewers can read results and reports.
        </p>
      </div>

      {error ? <p className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-950">Add member</h2>
          <form className="mt-5 space-y-4" onSubmit={handleAddMember}>
            <div className="space-y-2">
              <Label htmlFor="member-email">Email</Label>
              <Input id="member-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-user-id">Supabase user ID</Label>
              <Input
                id="member-user-id"
                onChange={(event) => setUserId(event.target.value)}
                placeholder="Required in API mode"
                value={userId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Role</Label>
              <select
                className="h-11 w-full rounded-md border bg-white px-3 text-sm font-semibold text-slate-900"
                id="member-role"
                onChange={(event) => setRole(event.target.value as WorkspaceRole)}
                value={role}
              >
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add member
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-950">Current members</h2>
          </div>
          <div className="mt-5 divide-y rounded-md border">
            {members.length === 0 ? (
              <p className="p-4 text-sm font-semibold text-slate-600">No members found.</p>
            ) : (
              members.map((member) => (
                <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between" key={member.id}>
                  <div>
                    <p className="font-bold text-slate-950">{member.email}</p>
                    <p className="text-xs font-semibold text-slate-500">{member.userId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-10 rounded-md border bg-white px-3 text-sm font-semibold text-slate-900"
                      disabled={member.role === "owner"}
                      onChange={(event) => handleRoleChange(member.id, event.target.value as WorkspaceRole)}
                      value={member.role}
                    >
                      <option value="owner">owner</option>
                      {roles.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <Button
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      disabled={member.role === "owner"}
                      onClick={() => handleDeleteMember(member.id)}
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
