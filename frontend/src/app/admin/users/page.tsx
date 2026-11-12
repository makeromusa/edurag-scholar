"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  BookOpen,
  Mail,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  enrolled_units?: string[];
  created_at?: string;
}

export default function AdminUsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "student">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setMessage(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setUsers(json.users || []);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to load scholars." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session?.access_token]);

  const toggleAdmin = async (user: UserProfile) => {
    if (!session?.access_token) return;
    if (user.email === "makeromusa17@gmail.com") {
      alert("Super Admin role cannot be modified.");
      return;
    }

    const nextRole = !user.is_admin;
    const confirmMsg = nextRole
      ? `Promote ${user.email} to Administrator? They will have full dashboard access.`
      : `Revoke administrator privileges for ${user.email}?`;

    if (!confirm(confirmMsg)) return;

    setActionLoading(user.id);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_admin: nextRole }),
      });
      if (!res.ok) throw new Error("Failed to update user privileges");
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_admin: nextRole } : u))
      );
      setMessage({ type: "success", text: `Updated privileges for ${user.email}.` });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Action failed." });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (user: UserProfile) => {
    if (!session?.access_token) return;
    if (user.email === "makeromusa17@gmail.com") {
      alert("Super Admin account cannot be deleted.");
      return;
    }

    if (!confirm(`Permanently delete account for ${user.email}? This action is irreversible.`)) {
      return;
    }

    setActionLoading(user.id);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setMessage({ type: "success", text: `Account for ${user.email} deleted.` });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Deletion failed." });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchQuery =
      (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q);
    if (!matchQuery) return false;
    if (roleFilter === "admin") return u.is_admin || u.email === "makeromusa17@gmail.com";
    if (roleFilter === "student") return !u.is_admin && u.email !== "makeromusa17@gmail.com";
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Scholars & Personnel</h1>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
              {users.length} Total Registered
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Directory of all student profiles, administrator credentials, and enrolled courses.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-800 bg-[#080d1a] hover:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
          <span>Refresh Users</span>
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl p-3 text-xs flex items-center gap-2 border ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
              : "border-rose-500/30 bg-rose-950/20 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scholar by email or name..."
            className="w-full rounded-xl border border-slate-800 bg-[#070b16] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex rounded-xl border border-slate-800 bg-[#070b16] p-1">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              roleFilter === "all" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter("student")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              roleFilter === "student" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Scholars
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              roleFilter === "admin" ? "bg-amber-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800/80 bg-[#050812] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Scholar / Identity</th>
                <th className="px-4 py-3.5">Privilege Level</th>
                <th className="px-4 py-3.5">Enrolled Units</th>
                <th className="px-4 py-3.5">Registered</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500 mb-2" />
                    <span>Loading scholars directory...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isSuperAdmin = u.email === "makeromusa17@gmail.com";
                  const isAdminRole = u.is_admin || isSuperAdmin;
                  const units = u.enrolled_units || [];

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase shrink-0">
                            {(u.full_name || u.email || "U").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{u.full_name || "Scholar"}</p>
                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                            <Shield className="h-3 w-3 text-amber-400" />
                            <span>Super Admin</span>
                          </span>
                        ) : isAdminRole ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-950/60 border border-violet-500/30 px-2.5 py-0.5 text-[10px] font-bold text-violet-300">
                            <Shield className="h-3 w-3" />
                            <span>Administrator</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-medium text-slate-300">
                            <UserCheck className="h-3 w-3 text-slate-400" />
                            <span>Student Scholar</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {units.length === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">No units enrolled</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {units.slice(0, 4).map((c) => (
                              <span
                                key={c}
                                className="rounded bg-slate-800/80 border border-slate-700/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300"
                              >
                                {c}
                              </span>
                            ))}
                            {units.length > 4 && (
                              <span className="text-[10px] text-slate-500 self-center">
                                +{units.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isSuperAdmin && (
                            <>
                              <button
                                onClick={() => toggleAdmin(u)}
                                disabled={actionLoading === u.id}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition ${
                                  isAdminRole
                                    ? "border-amber-500/30 text-amber-300 hover:bg-amber-950/30"
                                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                                }`}
                                title={isAdminRole ? "Demote from Admin" : "Promote to Admin"}
                              >
                                {isAdminRole ? "Demote" : "Make Admin"}
                              </button>

                              <button
                                onClick={() => deleteUser(u)}
                                disabled={actionLoading === u.id}
                                className="rounded-lg p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                                title="Delete user account"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
