"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  FileCheck2,
  FileText,
  Search,
  Layers,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  BookMarked
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Unit } from "./Sidebar";

interface IngestedDoc {
  id: string;
  unit_code: string;
  title: string;
  page_count: number;
  is_processed: boolean;
  file_size_bytes?: number;
  chunks_indexed: number;
  uploaded_at?: string;
  category?: "exam" | "book" | "formula";
}

interface AcademicVaultModalProps {
  units: Unit[];
  currentUnitCode: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectUnit?: (unitCode: string) => void;
  onTeachDocument?: (docId: string, title: string) => void;
}

export const AcademicVaultModal: React.FC<AcademicVaultModalProps> = ({
  units,
  currentUnitCode,
  isOpen,
  onClose,
  onSelectUnit,
  onTeachDocument,
}) => {
  const { session } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<string>(currentUnitCode);
  const [activeFilter, setActiveFilter] = useState<"all" | "books" | "exams" | "formulas">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<IngestedDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // In-App Document Reader State
  const [readingDoc, setReadingDoc] = useState<IngestedDoc | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageContent, setPageContent] = useState<string>("");
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUnit(currentUnitCode);
      setReadingDoc(null);
    }
  }, [isOpen, currentUnitCode]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchDocs = async () => {
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const res = await fetch(`${apiUrl}/api/documents?unit_code=${encodeURIComponent(selectedUnit)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch (e) {
        console.error("Failed to load vault documents", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, [isOpen, selectedUnit, session?.access_token]);

  // Load individual page content when reading a document
  useEffect(() => {
    if (!readingDoc) return;
    const fetchPage = async () => {
      setIsLoadingPage(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/professor/document/${readingDoc.id}/slide/${currentPage}`);
        if (res.ok) {
          const data = await res.json();
          setPageContent(data?.data?.raw_text || data?.data?.content || "No text available for this page.");
        } else {
          setPageContent("Could not load page content.");
        }
      } catch (e) {
        setPageContent("Failed to load page text.");
      } finally {
        setIsLoadingPage(false);
      }
    };
    fetchPage();
  }, [readingDoc, currentPage]);

  if (!isOpen) return null;

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

  const handleOpenDoc = (doc: IngestedDoc) => {
    setReadingDoc(doc);
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md">
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-800 bg-[#0c111d] text-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                Centralized Academic Notes & Exam Vault
                <span className="rounded bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                  UoN Chiromo Year 2
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Categorized textbooks, lecture slide decks, formula sheets & past exam papers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 7 Unit Selection Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-800/80 bg-[#090d16] px-4 py-2 gap-1.5 scrollbar-thin">
          {units.map((u) => {
            const isSelected = selectedUnit === u.code;
            return (
              <button
                key={u.code}
                onClick={() => {
                  setSelectedUnit(u.code);
                  setReadingDoc(null);
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

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Main Vault List */}
          <div className={`flex-1 flex flex-col overflow-hidden ${readingDoc ? "hidden md:flex md:w-1/2 border-r border-slate-800" : "w-full"}`}>
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
                  <span>Loading vault for {selectedUnit}...</span>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-center p-6 text-xs text-slate-500">
                  <FileText className="h-8 w-8 text-slate-600 mb-2 stroke-[1.2]" />
                  <p>No documents found matching this category filter.</p>
                </div>
              ) : (
                filteredDocs.map((doc) => {
                  const isSelected = readingDoc?.id === doc.id;
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
                            <h4 className="text-xs font-semibold text-white mt-1 leading-snug line-clamp-2" title={doc.title}>
                              {doc.title}
                            </h4>
                          </div>
                        </div>

                        {/* Status Check */}
                        <div className="flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400 shrink-0">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>{doc.chunks_indexed} chunks</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() => handleOpenDoc(doc)}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 text-xs font-semibold shadow-sm transition"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{isSelected ? "Currently Reading" : "Open & Read"}</span>
                        </button>

                        {onTeachDocument && (
                          <button
                            onClick={() => {
                              onTeachDocument(doc.id, doc.title);
                              onClose();
                            }}
                            className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-950/30 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-900/40 transition"
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

          {/* In-Website Document Page Reader Panel */}
          {readingDoc ? (
            <div className="flex-1 flex flex-col bg-[#080c16] overflow-hidden">
              {/* Reader Header */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    Reading {readingDoc.category === "exam" ? "Past Paper" : "Document"}
                  </span>
                  <h3 className="text-xs font-bold text-white truncate max-w-sm" title={readingDoc.title}>
                    {readingDoc.title}
                  </h3>
                </div>

                <button
                  onClick={() => setReadingDoc(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  Close Reader
                </button>
              </div>

              {/* Reader Pagination Controls */}
              <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/30 px-4 py-2 text-xs">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isLoadingPage}
                  className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev Page</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    Page <strong className="text-white">{currentPage}</strong> of <strong className="text-slate-300">{readingDoc.page_count}</strong>
                  </span>
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(readingDoc.page_count, p + 1))}
                  disabled={currentPage >= readingDoc.page_count || isLoadingPage}
                  className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
                >
                  <span>Next Page</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Reader Text Viewport */}
              <div className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-relaxed text-slate-200">
                {isLoadingPage ? (
                  <div className="flex h-64 items-center justify-center text-xs text-slate-400 gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <span>Loading Page {currentPage}...</span>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 shadow-inner">
                    <div className="mb-3 pb-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                      <span>{selectedUnit} Syllabus Content</span>
                      <span>Page {currentPage} of {readingDoc.page_count}</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200">
                      {pageContent}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
              <BookOpen className="h-12 w-12 text-slate-700 mb-3 stroke-[1.2]" />
              <h4 className="text-sm font-semibold text-slate-400">Select Any Document on the Left</h4>
              <p className="text-xs text-slate-600 max-w-xs mt-1">
                Click <strong>"Open & Read"</strong> on any past exam paper, textbook, or lecture slide to read its full pages right here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
