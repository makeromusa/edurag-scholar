"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Clock,
  RefreshCw,
  UploadCloud,
  ChevronLeft,
  BookOpen,
  FileCheck2,
  Sparkles,
  Layers,
  GraduationCap,
  Trash2
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getDirectPdfUrl } from "./AcademicVaultModal";

export interface ActiveCitation {
  type: "local_slide" | "web";
  unit_code?: string;
  file_name?: string;
  page_number?: number;
  slide_title?: string;
  url?: string;
  title?: string;
  content_preview?: string;
}

interface IngestedDoc {
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

interface DocumentViewerProps {
  citation: ActiveCitation | null;
  selectedUnit?: string;
  onClose?: () => void;
  onOpenUpload?: () => void;
  onTeachDocument?: (docId: string, title: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  citation,
  selectedUnit,
  onClose,
  onOpenUpload,
  onTeachDocument,
}) => {
  const { session } = useAuth();
  const [documents, setDocuments] = useState<IngestedDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [filterCategory, setFilterCategory] = useState<"all" | "books" | "exams" | "formulas">("all");

  // In-App Real PDF Preview State
  const [previewDoc, setPreviewDoc] = useState<IngestedDoc | null>(null);

  const fetchDocuments = async () => {
    if (!selectedUnit) return;
    setIsLoadingDocs(true);
    setPreviewDoc(null);
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
      console.error("Failed to load documents", e);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedUnit]);

  const handleDeleteDocument = async (docId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and purge all its vector chunks?`)) {
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`${apiUrl}/api/documents/${docId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (previewDoc?.id === docId) {
          setPreviewDoc(null);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to delete document.");
      }
    } catch (e: any) {
      alert(`Error deleting document: ${e.message}`);
    }
  };

  // 1. If a citation is active, show the citation excerpt preview
  if (citation) {
    const matchingDoc = documents.find((d) =>
      citation.file_name && d.title.toLowerCase().includes(citation.file_name.toLowerCase())
    );
    const pdfUrl = matchingDoc ? getDirectPdfUrl(matchingDoc) : (citation.file_name ? getDirectPdfUrl({ title: citation.file_name }) : undefined);

    return (
      <div className="flex h-full w-full flex-col bg-[#0b0f19] border-l border-slate-800 text-slate-200">
        {/* Viewer Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900/50">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1 rounded bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition mr-1"
                title="Return to Unit Course Library"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Library</span>
              </button>
            )}
            <Bookmark className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold text-white">
              {citation.type === "local_slide" ? `Slide ${citation.page_number}` : "Academic Web Source"}
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
              {citation.unit_code || "External"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {citation.url ? (
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded bg-blue-600/20 px-2 py-1 text-[11px] font-medium text-blue-400 hover:bg-blue-600/30"
              >
                <span>Open Source</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition"
              >
                <span>Open Real PDF</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        </div>

        {/* Slide Visual Card Preview */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-xl border border-slate-800 bg-[#0e1422] p-5 shadow-inner">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h4 className="text-sm font-bold text-blue-400">
                {citation.slide_title || citation.title || "Lecture Document Excerpt"}
              </h4>
              <span className="text-[10px] text-slate-400">
                {citation.file_name || "Course Notes"}
              </span>
            </div>

            <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-300">
              {citation.content_preview || "Document text loaded and verified against vector embedding."}
            </div>
          </div>

          {citation.type === "local_slide" && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 text-xs text-slate-400">
              <span>UoN Chiromo Syllabus Reference</span>
              <span className="font-semibold text-slate-300">
                Unit: {citation.unit_code} • Page {citation.page_number}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Categorization helpers
  const categorizeDoc = (title: string): "exam" | "book" | "formula" => {
    const t = title.toUpperCase();
    if (t.includes("EXAM") || t.includes("CAT") || t.includes("SUPP") || t.includes("TEST")) return "exam";
    if (t.includes("FORMULA") || t.includes("CHEAT") || t.includes("OUTLINE") || t.includes("REVISION") || t.includes("LAB EXERCISE")) return "formula";
    return "book";
  };

  const categorizedDocs = documents.map((d) => ({
    ...d,
    category: categorizeDoc(d.title),
    storage_url: getDirectPdfUrl(d),
  }));

  const filteredDocs = categorizedDocs.filter((d) => {
    if (filterCategory === "books" && d.category !== "book") return false;
    if (filterCategory === "exams" && d.category !== "exam") return false;
    if (filterCategory === "formulas" && d.category !== "formula") return false;
    return true;
  });

  const countBooks = categorizedDocs.filter((d) => d.category === "book").length;
  const countExams = categorizedDocs.filter((d) => d.category === "exam").length;
  const countFormulas = categorizedDocs.filter((d) => d.category === "formula").length;

  // 2. Real Original PDF Embedded Viewer
  if (previewDoc) {
    const previewPdfUrl = getDirectPdfUrl(previewDoc);
    return (
      <div className="flex h-full w-full flex-col bg-[#080c16] border-l border-slate-800 text-slate-200">
        {/* Viewer Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <button
              onClick={() => setPreviewDoc(null)}
              className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Return to library list"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                {previewDoc.category === "exam" ? "📝 Real Past Paper" : "📚 Real Course Document"}
              </span>
              <h3 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs" title={previewDoc.title}>
                {previewDoc.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={previewPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition"
              title="Open real PDF in native browser viewer or Adobe Acrobat"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">Open in Tab / Adobe</span>
              <span className="sm:hidden">Open</span>
            </a>
            {onTeachDocument && (
              <button
                onClick={() => onTeachDocument(previewDoc.id, previewDoc.title)}
                className="hidden sm:flex items-center gap-1 rounded bg-indigo-600/30 border border-indigo-500/40 px-2 py-1 text-[10px] font-semibold text-indigo-300 hover:bg-indigo-600/50"
              >
                <GraduationCap className="h-3 w-3" />
                <span>Teach</span>
              </button>
            )}
          </div>
        </div>

        {/* Real PDF Viewport */}
        <div className="flex-1 w-full h-full p-2 bg-[#0c111d] flex flex-col">
          <iframe
            src={`${previewPdfUrl}#toolbar=1&navpanes=1`}
            title={previewDoc.title}
            className="w-full flex-1 rounded-xl border border-slate-800 bg-white shadow-inner"
          />
        </div>
      </div>
    );
  }

  // 3. Default View: Real-Time Ingested Knowledge Base Library for this Unit
  return (
    <div className="flex h-full w-full flex-col bg-[#0b0f19] border-l border-slate-800 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-5 py-3 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white">Course Materials Library</h3>
            {selectedUnit && (
              <span className="rounded bg-blue-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                {selectedUnit}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Categorized notes, textbooks & exam papers</p>
        </div>

        <button
          onClick={fetchDocuments}
          disabled={isLoadingDocs}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white transition"
          title="Refresh indexing status"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingDocs ? "animate-spin text-blue-400" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Category Shelf Filter Pills */}
      <div className="flex items-center gap-1 border-b border-slate-800/80 bg-slate-950/60 px-4 py-2 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setFilterCategory("all")}
          className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition whitespace-nowrap ${
            filterCategory === "all"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          All ({categorizedDocs.length})
        </button>
        <button
          onClick={() => setFilterCategory("books")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition whitespace-nowrap ${
            filterCategory === "books"
              ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <BookOpen className="h-3 w-3 text-blue-400" />
          <span>Books & Slides ({countBooks})</span>
        </button>
        <button
          onClick={() => setFilterCategory("exams")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition whitespace-nowrap ${
            filterCategory === "exams"
              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <FileCheck2 className="h-3 w-3 text-emerald-400" />
          <span>Past Exams & CATs ({countExams})</span>
        </button>
        <button
          onClick={() => setFilterCategory("formulas")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition whitespace-nowrap ${
            filterCategory === "formulas"
              ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>Formulas ({countFormulas})</span>
        </button>
      </div>

      {/* Materials List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {filteredDocs.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-slate-800 bg-[#090d16]">
            <FileText className="h-8 w-8 text-slate-600 mb-2 stroke-[1.2]" />
            <p className="text-xs font-semibold text-slate-300">No Documents in this Category for {selectedUnit}</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Select another filter above or upload your notes to populate this unit.
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isReady = doc.is_processed && doc.chunks_indexed > 0;
            const isExam = doc.category === "exam";
            const isFormula = doc.category === "formula";
            const docPdfUrl = getDirectPdfUrl(doc);

            return (
              <div
                key={doc.id}
                className={`rounded-xl border p-3.5 transition ${
                  isReady
                    ? "border-slate-800 bg-[#0e1422] hover:border-slate-700"
                    : "border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50"
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
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                            isExam
                              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                              : isFormula
                              ? "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                              : "bg-blue-950/60 text-blue-300 border border-blue-800/40"
                          }`}
                        >
                          {isExam ? "Exam / CAT" : isFormula ? "Formula / Outline" : "Book / Slides"}
                        </span>
                        <span className="text-[10px] text-slate-500">{doc.page_count} pgs</span>
                      </div>

                      {/* Clickable title to open PDF directly */}
                      <a
                        href={docPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-white mt-1 leading-snug truncate max-w-[240px] sm:max-w-xs hover:text-blue-400 hover:underline cursor-pointer block"
                        title={`Click to open real PDF: ${doc.title}`}
                      >
                        {doc.title}
                      </a>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isReady ? (
                    <div className="flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      <span>{doc.chunks_indexed} chks</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 rounded bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 text-[9px] font-medium text-amber-300 shrink-0">
                      <Clock className="h-2.5 w-2.5 animate-spin" />
                      <span>Indexing...</span>
                    </div>
                  )}
                </div>

                {/* Actions: Guaranteed Open Real PDF, Preview, Teach, Delete */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Primary Open Real PDF Action */}
                    <a
                      href={docPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
                      title="Open real PDF in native browser viewer or Adobe Acrobat"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open Real PDF</span>
                    </a>

                    {/* Preview inside side drawer */}
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 px-2 py-1 text-[10px] text-slate-300 transition"
                      title="Preview PDF inside side pane"
                    >
                      <BookOpen className="h-3 w-3 text-blue-400" />
                      <span>Preview</span>
                    </button>

                    {onTeachDocument && isReady && (
                      <button
                        onClick={() => onTeachDocument(doc.id, doc.title)}
                        className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-950/30 px-2 py-1 text-[10px] font-semibold text-indigo-300 hover:bg-indigo-900/40 transition"
                        title="Have the Professor deconstruct and teach this document"
                      >
                        <GraduationCap className="h-3 w-3 text-indigo-400" />
                        <span className="hidden sm:inline">Teach</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteDocument(doc.id, doc.title)}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 px-1.5 py-1 rounded transition"
                    title="Delete document and purge vector chunks"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Quick Action */}
      {onOpenUpload && (
        <div className="border-t border-slate-800 bg-[#0a0f1d] p-4">
          <button
            onClick={onOpenUpload}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm shadow-blue-500/20"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Another Document for {selectedUnit}</span>
          </button>
        </div>
      )}
    </div>
  );
};
