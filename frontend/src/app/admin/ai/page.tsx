"use client";

import React, { useEffect, useState } from "react";
import {
  Cpu,
  Search,
  RefreshCw,
  Loader2,
  User,
  Clock,
  BookOpen,
  FileCheck2,
  MessageSquare,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface ChatQueryRecord {
  session_id?: string;
  unit_code?: string;
  query?: string;
  user_id?: string;
  user_email?: string;
  timestamp?: string;
}

interface ExamRecord {
  exam_id?: string;
  unit_code?: string;
  user_id?: string;
  user_email?: string;
  created_at?: string;
  score?: number;
}

export default function AdminAIPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<"queries" | "exams">("queries");
  const [queries, setQueries] = useState<ChatQueryRecord[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchAIData = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const [queriesRes, examsRes] = await Promise.allSettled([
        fetch(`${apiUrl}/api/admin/queries?limit=100`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${apiUrl}/api/admin/exams?limit=50`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (queriesRes.status === "fulfilled" && queriesRes.value.ok) {
        const qData = await queriesRes.value.json();
        setQueries(qData.queries || []);
      }

      if (examsRes.status === "fulfilled" && examsRes.value.ok) {
        const eData = await examsRes.value.json();
        setExams(eData.exams || []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load AI telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, [session?.access_token]);

  const uniqueUnits = Array.from(
    new Set([
      ...queries.map((q) => q.unit_code).filter(Boolean),
      ...exams.map((e) => e.unit_code).filter(Boolean),
    ])
  );

  const filteredQueries = queries.filter((q) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (q.query || "").toLowerCase().includes(term) ||
      (q.user_email || "").toLowerCase().includes(term) ||
      (q.unit_code || "").toLowerCase().includes(term) ||
      (q.session_id || "").toLowerCase().includes(term);
    const matchesUnit = unitFilter === "all" || q.unit_code === unitFilter;
    return matchesSearch && matchesUnit;
  });

  const filteredExams = exams.filter((e) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (e.user_email || "").toLowerCase().includes(term) ||
      (e.unit_code || "").toLowerCase().includes(term) ||
      (e.exam_id || "").toLowerCase().includes(term);
    const matchesUnit = unitFilter === "all" || e.unit_code === unitFilter;
    return matchesSearch && matchesUnit;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AI Query & Exam Monitor
            </h1>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
              Fully Attributed (No Anonymization)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time audit log of student inquiries, RAG retrievals, and simulated exam attempts.
          </p>
        </div>

        <button
          onClick={fetchAIData}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-800 bg-[#080d1a] hover:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex rounded-xl border border-slate-800 bg-[#070b16] p-1">
          <button
            onClick={() => setActiveTab("queries")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "queries"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat Inquiries ({queries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("exams")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "exams"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Mock Exams ({exams.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Unit selector */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-[#070b16] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Units</option>
            {uniqueUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or keywords..."
              className="w-full rounded-xl border border-slate-800 bg-[#070b16] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Content Feed */}
      {activeTab === "queries" ? (
        <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800/80 bg-[#050812] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Student Scholar</th>
                  <th className="px-4 py-3.5">Unit</th>
                  <th className="px-4 py-3.5">Inquiry / Prompt</th>
                  <th className="px-4 py-3.5">Session</th>
                  <th className="px-4 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-500 mb-2" />
                      <span>Loading MongoDB chat telemetry...</span>
                    </td>
                  </tr>
                ) : filteredQueries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500">
                      No student queries found.
                    </td>
                  </tr>
                ) : (
                  filteredQueries.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600/20 text-blue-400 text-[10px] font-bold shrink-0">
                            <User className="h-3 w-3" />
                          </div>
                          <span className="font-semibold text-white">
                            {q.user_email || "Anonymous Scholar"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-violet-300 bg-violet-950/50 border border-violet-500/30 px-2 py-0.5 rounded text-[10px]">
                          {q.unit_code || "CSC 311"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 max-w-md">
                        <p className="text-slate-200 line-clamp-2 leading-relaxed">
                          {q.query || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                        {q.session_id ? q.session_id.slice(0, 10) + "..." : "—"}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap text-slate-400 text-[11px]">
                        {q.timestamp ? new Date(q.timestamp).toLocaleString() : "Just now"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Exams Table */
        <div className="rounded-2xl border border-slate-800/80 bg-[#070b16] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800/80 bg-[#050812] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Student Scholar</th>
                  <th className="px-4 py-3.5">Unit</th>
                  <th className="px-4 py-3.5">Exam ID</th>
                  <th className="px-4 py-3.5">Score Awarded</th>
                  <th className="px-4 py-3.5 text-right">Attempt Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-500 mb-2" />
                      <span>Loading exam telemetry...</span>
                    </td>
                  </tr>
                ) : filteredExams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500">
                      No simulated exams recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredExams.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-white">
                          {e.user_email || "Student Scholar"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px]">
                          {e.unit_code}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[10px]">
                        {e.exam_id || "—"}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {e.score !== undefined ? (
                          <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                            {e.score}%
                          </span>
                        ) : (
                          <span className="text-slate-500">Pending Evaluation</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap text-slate-400 text-[11px]">
                        {e.created_at ? new Date(e.created_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
