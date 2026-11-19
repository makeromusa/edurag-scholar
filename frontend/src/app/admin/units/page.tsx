"use client";

import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Archive,
  Layers,
  Check,
  X,
  Clock,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface UnitItem {
  id: string;
  code: string;
  name: string;
  lecturer?: string;
  venue?: string;
  doc_count?: number;
  is_system_unit?: boolean;
  status?: string;
  creator_email?: string | null;
  created_by?: string | null;
}

export default function AdminUnitsPage() {
  const { session } = useAuth();
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "system" | "custom">("all");

  // New unit form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newLecturer, setNewLecturer] = useState("");
  const [newVenue, setNewVenue] = useState("Main Campus");
  const [creating, setCreating] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";

  const fetchUnits = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/units`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setUnits(json.units || []);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to load units." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [session?.access_token]);

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;
    setCreating(true);
    setMessage(null);
    const code = newCode.trim().toUpperCase();
    const name = newName.trim();
    const lecturer = newLecturer.trim() || "Faculty Lecturer";

    try {
      const res = await fetch(`${API_URL}/api/admin/units`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code, name, lecturer, venue: newVenue, is_system_unit: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create unit");
      }
      setMessage({ type: "success", text: `Unit ${code} (${name}) registered successfully.` });
      setNewCode("");
      setNewName("");
      setNewLecturer("");
      setIsAddOpen(false);
      fetchUnits();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to create unit." });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUnit = async (unit: UnitItem) => {
    if (!session?.access_token) return;
    if (!confirm(`Delete unit ${unit.code}? This cannot be undone.`)) return;

    setActionLoading(unit.code);
    try {
      const res = await fetch(`${API_URL}/api/admin/units/${unit.code}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to delete unit");
      setUnits((prev) => prev.filter((u) => u.code !== unit.code));
      setMessage({ type: "success", text: `Unit ${unit.code} deleted.` });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Deletion failed." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveUnit = async (unit: UnitItem) => {
    if (!session?.access_token) return;
    setActionLoading(unit.code);
    try {
      const res = await fetch(`${API_URL}/api/admin/units/${unit.code}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to approve unit");
      setMessage({ type: "success", text: `Unit ${unit.code} approved & student enrolled.` });
      fetchUnits();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Approval failed." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUnit = async (unit: UnitItem) => {
    if (!session?.access_token) return;
    if (!confirm(`Reject and permanently remove ${unit.code}?`)) return;
    setActionLoading(unit.code);
    try {
      const res = await fetch(`${API_URL}/api/admin/units/${unit.code}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to reject unit");
      setUnits((prev) => prev.filter((u) => u.code !== unit.code));
      setMessage({ type: "success", text: `Unit ${unit.code} rejected.` });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Rejection failed." });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = units.filter((u) => u.status === "pending_approval").length;

  const filtered = units.filter((u) => {
    const q = search.toLowerCase();
    const matchQuery =
      (u.code || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q) ||
      (u.lecturer || "").toLowerCase().includes(q);
    if (!matchQuery) return false;
    if (filter === "pending") return u.status === "pending_approval";
    if (filter === "system") return u.is_system_unit;
    if (filter === "custom") return !u.is_system_unit;
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Units & Curriculum</h1>
            <span className="rounded-full bg-violet-500/10 border border-violet-500/30 px-2.5 py-0.5 text-[10px] font-bold text-violet-300">
              {units.filter((u) => u.status === "active").length} Active
            </span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Course units, student unit requests (approve / reject), and knowledge bases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Unit</span>
          </button>
          <button
            onClick={fetchUnits}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#080d1a] hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-violet-400" : ""}`} />
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl p-3 text-xs flex items-center gap-2 border ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
              : "border-rose-500/30 bg-rose-950/20 text-rose-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Add Unit Form */}
      {isAddOpen && (
        <form
          onSubmit={handleCreateUnit}
          className="rounded-2xl border border-blue-500/30 bg-[#070d1e] p-5 shadow-2xl animate-in fade-in duration-150 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-400" />
              <span>Register New System Unit</span>
            </h3>
            <button type="button" onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white text-xs">Cancel</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Unit Code</label>
              <input
                type="text" required value={newCode} onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. CSC 421"
                className="mt-1 w-full rounded-xl border border-slate-800 bg-[#040813] px-3 py-2 text-xs text-white uppercase font-bold placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Unit Name</label>
              <input
                type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Advanced Distributed Systems"
                className="mt-1 w-full rounded-xl border border-slate-800 bg-[#040813] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Lecturer</label>
              <input
                type="text" value={newLecturer} onChange={(e) => setNewLecturer(e.target.value)}
                placeholder="e.g. Prof. Omwenga"
                className="mt-1 w-full rounded-xl border border-slate-800 bg-[#040813] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit" disabled={creating}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Save & Publish Unit</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1.5 rounded-xl border border-slate-800 bg-[#060a14] p-1">
          {(["all", "pending", "system", "custom"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition ${
                filter === f
                  ? f === "pending"
                    ? "bg-amber-600/20 text-amber-300 border border-amber-500/30"
                    : "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {f === "all" ? "All" : f === "pending" ? `Pending (${pendingCount})` : f === "system" ? "System" : "Custom"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by code, title, or professor..."
            className="w-full rounded-xl border border-slate-800 bg-[#070b16] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500 mb-2" />
            <span>Loading curriculum registry...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            No units found.
          </div>
        ) : (
          filtered.map((u) => {
            const isPending = u.status === "pending_approval";
            const isSystem = u.is_system_unit ?? true;
            const isActioning = actionLoading === u.code;
            return (
              <div
                key={u.code}
                className={`rounded-2xl border p-4 flex flex-col justify-between hover:border-slate-700 transition group ${
                  isPending
                    ? "border-amber-500/30 bg-amber-950/5"
                    : "border-slate-800/80 bg-[#070b16]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-violet-300 font-mono tracking-wide">{u.code}</span>
                    {isPending ? (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-amber-950/60 border-amber-500/30 text-amber-300 animate-pulse">
                        <Clock className="h-3 w-3" /> Pending Approval
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isSystem ? "bg-blue-950/60 border-blue-500/30 text-blue-300" : "bg-emerald-950/60 border-emerald-500/30 text-emerald-300"
                        }`}
                      >
                        {isSystem ? "System" : "Custom"}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">{u.name}</h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Lecturer: <span className="text-slate-300">{u.lecturer || "Faculty"}</span>
                  </p>
                  {isPending && u.creator_email && (
                    <p className="mt-1 text-[10px] text-amber-400/80 flex items-center gap-1">
                      <User className="h-3 w-3" /> Requested by: {u.creator_email}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{u.doc_count ?? 0} docs</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleApproveUnit(u)}
                          disabled={isActioning}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition"
                          title="Approve"
                        >
                          {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectUnit(u)}
                          disabled={isActioning}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-[10px] font-bold border border-rose-500/30 transition"
                          title="Reject"
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteUnit(u)}
                      disabled={isActioning}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition opacity-0 group-hover:opacity-100"
                      title="Delete unit"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
