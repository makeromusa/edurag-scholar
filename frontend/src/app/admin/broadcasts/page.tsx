"use client";

import React, { useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Radio,
  Send,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface BroadcastItem {
  id: string;
  title: string;
  body: string;
  target?: string;
  created_by?: string;
  created_at?: string;
  is_active?: boolean;
}

export default function AdminBroadcastsPage() {
  const { session } = useAuth();
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");

  const fetchBroadcasts = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setMessage(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/admin/broadcasts`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setBroadcasts(json.broadcasts || []);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to load broadcasts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, [session?.access_token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;
    setCreating(true);
    setMessage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/admin/broadcasts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), target }),
      });
      if (!res.ok) throw new Error("Failed to post broadcast");
      setMessage({ type: "success", text: "Broadcast transmitted to student scholar portals." });
      setTitle("");
      setBody("");
      fetchBroadcasts();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to post broadcast." });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.access_token) return;
    if (!confirm("Retract and delete this broadcast?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/admin/broadcasts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to delete broadcast");
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      setMessage({ type: "success", text: "Broadcast retracted." });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Deletion failed." });
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Campus Broadcasts</h1>
            <span className="rounded-full bg-violet-500/10 border border-violet-500/30 px-2.5 py-0.5 text-[10px] font-bold text-violet-300">
              Push Announcements
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Publish urgent notices, exam date updates, and revision guidelines directly to students.
          </p>
        </div>

        <button
          onClick={fetchBroadcasts}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-800 bg-[#080d1a] hover:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-violet-400" : ""}`} />
          <span>Refresh</span>
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
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Broadcast Composer */}
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-violet-500/30 bg-[#070b18] p-5 shadow-2xl space-y-3.5"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Radio className="h-4 w-4 text-violet-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Compose New Announcement
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300">Broadcast Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CSC 311 CAT II Rescheduled to Thursday 10:00 AM"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-[#040813] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Audience Scope</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-800 bg-[#040813] px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="all">All Registered Scholars</option>
              <option value="CSC 311">CSC 311 Only</option>
              <option value="CSC 313">CSC 313 Only</option>
              <option value="CSC 315">CSC 315 Only</option>
              <option value="CSC 317">CSC 317 Only</option>
              <option value="CSC 323">CSC 323 Only</option>
              <option value="CSC 325">CSC 325 Only</option>
              <option value="SMA 301">SMA 301 Only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300">Message Content</label>
          <textarea
            required
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Detailed instructions, venue directions, or syllabus revision notes..."
            className="mt-1 w-full rounded-xl border border-slate-800 bg-[#040813] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Transmit Broadcast</span>
          </button>
        </div>
      </form>

      {/* Broadcasts History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Active Broadcast History
        </h3>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500 mb-2" />
            <span>Loading broadcast log...</span>
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#070b16] p-8 text-center text-slate-500 text-xs">
            No active broadcasts currently published.
          </div>
        ) : (
          broadcasts.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-800/80 bg-[#070b16] p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{b.title}</span>
                  <span className="text-[10px] font-mono text-violet-300 bg-violet-950/60 border border-violet-500/30 px-2 py-0.5 rounded">
                    {b.target === "all" ? "All Students" : b.target}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{b.body}</p>
                <p className="text-[10px] text-slate-500">
                  Posted by {b.created_by || "Admin"} •{" "}
                  {b.created_at ? new Date(b.created_at).toLocaleString() : "Recently"}
                </p>
              </div>

              <button
                onClick={() => handleDelete(b.id)}
                className="self-end sm:self-start p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                title="Retract broadcast"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
