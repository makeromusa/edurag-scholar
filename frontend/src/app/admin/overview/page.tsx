"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  FileText,
  Cpu,
  FileCheck2,
  Sparkles,
  TrendingUp,
  Activity,
  Megaphone,
  Shield,
  Loader2,
  RefreshCw,
  Server,
  Database,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface OverviewData {
  total_users: number;
  admin_count: number;
  total_units: number;
  total_documents: number;
  total_queries: number;
  total_exams: number;
  total_flashcards: number;
  new_users_this_week: number;
  users_by_enrollment?: Array<{ email: string; units: number }>;
}

export default function AdminOverviewPage() {
  const { session } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/admin/overview`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to load admin overview: HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to load overview data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [session?.access_token]);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Executive Operations</h1>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              Live Production
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time telemetry and management across EduRAG Scholar AI Copilot infrastructure.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-800 bg-[#080d1a] hover:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scholars */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Registered Scholars</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {loading ? "..." : data?.total_users ?? 0}
            </span>
            <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>+{data?.new_users_this_week ?? 0} active this week</span>
            </p>
          </div>
        </div>

        {/* Units */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Units</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {loading ? "..." : data?.total_units ?? 7}
            </span>
            <p className="mt-1 text-[11px] text-slate-400 font-medium">
              Curriculum + Custom student courses
            </p>
          </div>
        </div>

        {/* Documents */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Ingested Documents</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {loading ? "..." : data?.total_documents ?? 56}
            </span>
            <p className="mt-1 text-[11px] text-cyan-400 font-medium">
              Supabase Storage • RAG Indexed
            </p>
          </div>
        </div>

        {/* AI Queries */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Attributed AI Queries</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {loading ? "..." : data?.total_queries ?? 0}
            </span>
            <p className="mt-1 text-[11px] text-amber-300 font-medium">
              Logged & Auditable in MongoDB
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Service Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: AI Assessment Activity */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-[#070b16] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
              <span>Assessment & Academic Memory Engine</span>
            </h3>
            <span className="text-[10px] text-slate-500">Autonomous Workers</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-[#0a0f1d] p-3.5">
              <span className="text-[11px] text-slate-400">Mock Exams Generated</span>
              <p className="mt-1 text-xl font-bold text-white">{data?.total_exams ?? 0}</p>
              <span className="text-[10px] text-emerald-400">Exam Simulator Live</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0a0f1d] p-3.5">
              <span className="text-[11px] text-slate-400">Flashcards Mastered</span>
              <p className="mt-1 text-xl font-bold text-white">{data?.total_flashcards ?? 0}</p>
              <span className="text-[10px] text-violet-400">SuperMemo SM-2</span>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-800 bg-[#0a0f1d] p-3.5">
              <span className="text-[11px] text-slate-400">Admin Personnel</span>
              <p className="mt-1 text-xl font-bold text-amber-300">{data?.admin_count ?? 1}</p>
              <span className="text-[10px] text-amber-400/80">makeromusa17@gmail.com</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
            <Link
              href="/admin/ai"
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Inspect Attributed Queries</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
            >
              <Users className="h-3.5 w-3.5 text-blue-400" />
              <span>Manage Scholars</span>
            </Link>
            <Link
              href="/admin/broadcasts"
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
            >
              <Megaphone className="h-3.5 w-3.5 text-violet-400" />
              <span>Broadcast Announcement</span>
            </Link>
          </div>
        </div>

        {/* Right: Cloud Infrastructure Heartbeat */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              <span>Infrastructure Stack</span>
            </h3>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-[#0a0f1d]">
              <div className="flex items-center gap-2.5">
                <Server className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs font-bold text-white">Azure App Service</p>
                  <p className="text-[10px] text-slate-500">FastAPI • Gunicorn Workers</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-[#0a0f1d]">
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-white">Supabase PostgreSQL</p>
                  <p className="text-[10px] text-slate-500">Row-Level Security Enabled</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                Protected
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-[#0a0f1d]">
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-xs font-bold text-white">MongoDB Atlas Cluster</p>
                  <p className="text-[10px] text-slate-500">Chat Transcripts & Exams</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-[#0a0f1d]">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-violet-400" />
                <div>
                  <p className="text-xs font-bold text-white">Gemini / Azure LLM</p>
                  <p className="text-[10px] text-slate-500">Zero-500 Routing Fallback</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
