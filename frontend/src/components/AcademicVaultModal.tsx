"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  BookOpen,
  FileCheck2,
  FileText,
  Search,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  BookMarked,
  ArrowLeft,
  ShieldCheck,
  Lock,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Unit } from "./Sidebar";

export interface IngestedDoc {
  id: string;
  unit_code: string;
  title: string;
  page_count: number;
  is_processed: boolean;
  file_size_bytes?: number;
  chunks_indexed: number;
  uploaded_at?: string;
  storage_url?: string;
  category?: "exam" | "book" | "formula";
}

interface AcademicVaultModalProps {
  units: Unit[];
  currentUnitCode: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSelectUnit?: (unitCode: string) => void;
  onTeachDocument?: (docId: string, title: string) => void;
  isPage?: boolean;
}

export const getDirectPdfUrl = (doc: { title: string; storage_url?: string }) => {
  if (doc.storage_url && doc.storage_url.startsWith("http")) {
    return doc.storage_url;
  }
  const SUPABASE_STORAGE_BASE = "https://xccrkalsujefsghtuirp.supabase.co/storage/v1/object/public/course-documents";
  return `${SUPABASE_STORAGE_BASE}/${encodeURIComponent(doc.title)}`;
};

export const AcademicVaultModal: React.FC<AcademicVaultModalProps> = ({
  units,
  currentUnitCode,
  isOpen = false,
  onClose,
  onSelectUnit,
  onTeachDocument,
  isPage = false,
}) => {
  const { session } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<string>(currentUnitCode);
  const [activeFilter, setActiveFilter] = useState<"all" | "books" | "exams" | "formulas">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<IngestedDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<IngestedDoc | null>(null);

  const isEffectivelyOpen = isPage || isOpen;

  useEffect(() => {
    if (isEffectivelyOpen) {
      setSelectedUnit(currentUnitCode);
      setPreviewDoc(null);
    }
  }, [isEffectivelyOpen, currentUnitCode]);

  useEffect(() => {
    if (!isEffectivelyOpen) return;
    const fetchDocs = async () => {
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const res = await fetch(`${apiUrl}/api/documents?unit_code=${encodeURIComponent(selectedUnit)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const rawDocs: IngestedDoc[] = data.documents || [];
          const resolvedDocs = rawDocs.map((d) => ({
            ...d,
            storage_url: getDirectPdfUrl(d),
          }));
          setDocuments(resolvedDocs);
        }
      } catch (e) {
        console.error("Failed to load vault documents", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, [isEffectivelyOpen, selectedUnit, session?.access_token]);

  if (!isEffectivelyOpen) return null;

  // Categorize documents cleanly
  const categorizeDoc = (title: string): "exam" | "book" | "formula" => {
    const t = title.toUpperCase();
    if (t.includes("EXAM") || t.includes("CAT") || t.includes("SUPP") || t.includes("TEST")) return "exam";
    if (t.includes("FORMULA") || t.includes("CHEAT") || t.includes("OUTLINE") || t.includes("REVISION") || t.includes("LAB EXERCISE")) return "formula";
    return "book";
  };

  const categorized = documents.map((d) => ({
    ...d,
    category: categorizeDoc(d.title),
    storage_url: getDirectPdfUrl(d),
  }));

  const filteredDocs = categorized.filter((d) => {
    if (activeFilter === "books" && d.category !== "book") return false;
    if (activeFilter === "exams" && d.category !== "exam") return false;
    if (activeFilter === "formulas" && d.category !== "formula") return false;
    if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const countBooks = categorized.filter((d) => d.category === "book").length;
  const countExams = categorized.filter((d) => d.category === "exam").length;
  const countFormulas = categorized.filter((d) => d.category === "formula").length;

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const innerVault = (
    <div className={`flex flex-col rounded-2xl border border-slate-800 bg-[#0c111d] text-slate-200 shadow-2xl overflow-hidden ${isPage ? "w-full max-w-7xl mx-auto h-[86vh]" : "h-full max-h-[92vh] w-full max-w-5xl"}`}>
      {/* Modal Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <BookMarked className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              Curriculum Knowledge Vault
              <span className="rounded bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                Course Knowledge Base
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Verified syllabus outlines, course slide topics, and past examination rubrics indexed in your AI brain
            </p>
          </div>
        </div>

        {onClose && !isPage && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Unit Selection Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800/80 bg-[#090d16] px-4 py-2 gap-1.5 scrollbar-thin">
        {units.map((u) => {
          const isSelected = selectedUnit === u.code;
          return (
            <button
              key={u.code}
              onClick={() => {
                setSelectedUnit(u.code);
                setPreviewDoc(null);
                if (onSelectUnit) onSelectUnit(u.code);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <span>{u.code}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Main Vault List */}
        <div className={`flex-1 flex flex-col overflow-hidden ${previewDoc ? "hidden md:flex md:w-1/2 border-r border-slate-800" : "w-full"}`}>
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 bg-slate-900/40 p-3 sm:px-5">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeFilter === "all"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                All ({categorized.length})
              </button>
              <button
                onClick={() => setActiveFilter("books")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeFilter === "books"
                    ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <BookOpen className="h-3 w-3 text-blue-400" />
                <span>Books & Slides ({countBooks})</span>
              </button>
              <button
                onClick={() => setActiveFilter("exams")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeFilter === "exams"
                    ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <FileCheck2 className="h-3 w-3 text-emerald-400" />
                <span>Past Exams & CATs ({countExams})</span>
              </button>
              <button
                onClick={() => setActiveFilter("formulas")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeFilter === "formulas"
                    ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Formulas ({countFormulas})</span>
              </button>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 rounded-lg border border-slate-700 bg-slate-950/80 pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Document Cards List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-xs text-slate-400 gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span>Loading knowledge index for {selectedUnit}...</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center p-6 text-xs text-slate-500">
                <FileText className="h-8 w-8 text-slate-600 mb-2 stroke-[1.2]" />
                <p>No documents found matching this category filter.</p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = previewDoc?.id === doc.id;
                const isExam = doc.category === "exam";
                const isFormula = doc.category === "formula";

                return (
                  <div
                    key={doc.id}
                    className={`rounded-xl border p-3.5 transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-950/20 shadow-md"
                        : "border-slate-800 bg-[#0e1422] hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isExam
                              ? "bg-emerald-600/20 text-emerald-400"
                              : isFormula
                              ? "bg-amber-600/20 text-amber-400"
                              : "bg-blue-600/20 text-blue-400"
                          }`}
                        >
                          {isExam ? (
                            <FileCheck2 className="h-4 w-4" />
                          ) : isFormula ? (
                            <Sparkles className="h-4 w-4" />
                          ) : (
                            <BookOpen className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                isExam
                                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                                  : isFormula
                                  ? "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                                  : "bg-blue-950/60 text-blue-300 border border-blue-800/40"
                              }`}
                            >
                              {isExam ? "Past Paper" : isFormula ? "Formula / Outline" : "Book / Slides"}
                            </span>
                            <span className="text-[10px] text-slate-500">{doc.page_count} pages</span>
                            {doc.file_size_bytes && (
                              <span className="text-[10px] text-slate-500">• {formatBytes(doc.file_size_bytes)}</span>
                            )}
                          </div>

                          {/* Inspectable Title */}
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="text-left text-xs font-semibold text-white mt-1 leading-snug line-clamp-2 hover:text-blue-400 cursor-pointer block transition"
                            title={`Inspect dossier: ${doc.title}`}
                          >
                            {doc.title}
                          </button>
                        </div>
                      </div>

                      {/* Status Check & Chunks */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>{doc.chunks_indexed} chunks</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Inspect Dossier & Teach in Studio */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
                          title="Inspect vector index and syllabus coverage"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Inspect Dossier</span>
                        </button>
                      </div>

                      {onTeachDocument && (
                        <button
                          type="button"
                          onClick={() => {
                            onTeachDocument(doc.id, doc.title);
                            if (onClose) onClose();
                          }}
                          className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-950/30 px-2 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-900/40 transition"
                          title="Deconstruct with Professor Musa in Oral Studio"
                        >
                          <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Teach in Studio</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Knowledge & Curriculum Dossier Viewer */}
        {previewDoc ? (
          <div className="flex-1 flex flex-col bg-[#080c16] overflow-y-auto">
            {/* Dossier Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5 py-3.5 sticky top-0 z-10 backdrop-blur">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Curriculum Intelligence Dossier
                  </span>
                  <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.2 text-[9px] font-medium text-slate-300">
                    {previewDoc.unit_code || selectedUnit}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white truncate max-w-md mt-0.5" title={previewDoc.title}>
                  {previewDoc.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                Close
              </button>
            </div>

            {/* Dossier Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Status & Security Banner */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-emerald-300">Verified Knowledge Asset</h4>
                      <span className="rounded bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 font-semibold">Active RAG Indexed</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      This academic document has been synthesized into EduRAG&apos;s high-dimensional vector space. Its concepts, definitions, and examination questions are continuously referenced across all AI studios.
                    </p>
                  </div>
                </div>
              </div>

              {/* Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-[#0e1422] p-3.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Indexed Chunks</span>
                  <div className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>{previewDoc.chunks_indexed}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Embedding vectors</span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#0e1422] p-3.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Document Length</span>
                  <div className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    <span>{previewDoc.page_count}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Pages processed</span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#0e1422] p-3.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Material Class</span>
                  <div className="text-sm font-bold text-white mt-1.5">
                    {previewDoc.category === "exam" ? "Past Paper / Rubric" : previewDoc.category === "formula" ? "Formula Sheet" : "Core Slides & Book"}
                  </div>
                  <span className="text-[10px] text-slate-400">Unit: {selectedUnit}</span>
                </div>
              </div>

              {/* Recommended AI Actions for this Document */}
              <div className="rounded-xl border border-slate-800 bg-[#0e1422] p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>Targeted Study Actions with this Material</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {onTeachDocument && (
                    <button
                      type="button"
                      onClick={() => {
                        onTeachDocument(previewDoc.id, previewDoc.title);
                        if (onClose) onClose();
                      }}
                      className="flex items-start gap-2.5 rounded-lg border border-indigo-500/30 bg-indigo-950/40 p-3 text-left hover:bg-indigo-900/40 transition group cursor-pointer"
                    >
                      <div className="rounded-md bg-indigo-600/30 p-2 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-indigo-300">Teach in Oral Studio</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Listen to professor audio lecture explaining these specific slides</div>
                      </div>
                    </button>
                  )}

                  <Link
                    href={`/copilot?unit=${encodeURIComponent(selectedUnit)}`}
                    className="flex items-start gap-2.5 rounded-lg border border-blue-500/30 bg-blue-950/40 p-3 text-left hover:bg-blue-900/40 transition group cursor-pointer"
                  >
                    <div className="rounded-md bg-blue-600/30 p-2 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-300">Ask Copilot About This</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Solve exercises, explain formulas, or extract exam topics</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Security & Intellectual Property Notice */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 flex items-start gap-2.5 text-slate-500">
                <Lock className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Intellectual Property & Anti-Scraping Protection:</strong> Raw source files are kept securely encrypted in cold storage. Access is facilitated through transformative AI retrieval, dynamic flashcards, and verified academic citations.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
            <BookOpen className="h-12 w-12 text-slate-700 mb-3 stroke-[1.2]" />
            <h4 className="text-sm font-semibold text-slate-400">Select Any Syllabus Material on the Left</h4>
            <p className="text-xs text-slate-600 max-w-xs mt-1">
              Click <strong>&quot;Inspect Dossier&quot;</strong> on any unit document to explore its vector coverage, pages indexed, and launch an oral lecture or AI study session.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (isPage) {
    return (
      <div className="min-h-screen w-full bg-[#0b1329] text-slate-100 flex flex-col">
        {/* Top Breadcrumb Bar */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b1329]/95 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-xs font-semibold text-blue-400 hidden sm:inline">Academic Vault</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-300">
              {selectedUnit}
            </span>
          </div>
        </header>

        <main className="flex-1 w-full px-2 sm:px-6 py-4 flex flex-col justify-center">
          {innerVault}
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md">
      {innerVault}
    </div>
  );
};
