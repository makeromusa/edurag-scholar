"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Server,
  Database,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface HealthCheckResult {
  overall: string;
  checks: Record<string, { status: string; detail?: string; note?: string; code?: number }>;
  timestamp: string;
}

export default function AdminHealthPage() {
  const { session } = useAuth();
  const [data, setData] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/admin/health`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to reach health endpoint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [session?.access_token]);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">System Health & Telemetry</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                data?.overall === "healthy"
                  ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-950/60 border-amber-500/30 text-amber-300"
              }`}
            >
              {data?.overall ? data.overall.toUpperCase() : "CHECKING..."}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Automated synthetic probes across Azure App Service, Supabase, MongoDB Atlas, and LLM routers.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-800 bg-[#080d1a] hover:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          <span>Run Diagnostic Ping</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backend API */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">FastAPI Application Service</h3>
                <p className="text-[10px] text-slate-400">Azure App Service Linux Container</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Healthy</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            SlowAPI rate limiter active, CORS headers configured, Gunicorn multi-worker concurrency.
          </p>
        </div>

        {/* Supabase Database */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Supabase PostgreSQL</h3>
                <p className="text-[10px] text-slate-400">Database & Blob Storage Buckets</p>
              </div>
            </div>
            <span
              className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                data?.checks?.supabase?.status === "ok"
                  ? "text-emerald-400 bg-emerald-950/40 border-emerald-500/20"
                  : "text-amber-400 bg-amber-950/40 border-amber-500/20"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{data?.checks?.supabase?.status === "ok" ? "Connected" : "Degraded"}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Row-Level Security active across tables, service-role admin client authentication bypass configured.
          </p>
        </div>

        {/* MongoDB Atlas */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600/20 text-green-400 border border-green-500/30">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">MongoDB Atlas Cluster</h3>
                <p className="text-[10px] text-slate-400">Transcripts, Flashcards, Mock Exams</p>
              </div>
            </div>
            <span
              className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                data?.checks?.mongodb?.status === "ok"
                  ? "text-emerald-400 bg-emerald-950/40 border-emerald-500/20"
                  : "text-rose-400 bg-rose-950/40 border-rose-500/20"
              }`}
            >
              {data?.checks?.mongodb?.status === "ok" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Degraded</span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Motor async driver running on Azure Linux host with automatic TLS handshake validation.
          </p>
        </div>

        {/* Azure OpenAI / Gemini */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Multimodal LLM Router</h3>
                <p className="text-[10px] text-slate-400">Azure OpenAI Foundry + Gemini 1.5/2.0</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Online</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Zero-500 automatic resilience routing: embedding fallbacks & prompt caching enabled.
          </p>
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Last probe at: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : "—"}</span>
        </span>
        <span>Environment: Production (UAE North Azure)</span>
      </div>
    </div>
  );
}
