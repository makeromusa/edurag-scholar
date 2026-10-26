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
  Layers,
  Paperclip,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

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
}

interface DocumentViewerProps {
  citation: ActiveCitation | null;
  selectedUnit?: string;
  onClose?: () => void;
  onOpenUpload?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  citation,
  selectedUnit,
  onClose,
  onOpenUpload,
}) => {
  const { session } = useAuth();
  const [documents, setDocuments] = useState<IngestedDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const fetchDocuments = async () => {
    if (!selectedUnit) return;
    setIsLoadingDocs(true);
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
      console.error("Failed to load documents", e);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedUnit]);

  // Format bytes helper
  const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // 1. If a citation is active, show the synchronized slide preview
  if (citation) {
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

          {citation.url && (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded bg-blue-600/20 px-2 py-1 text-[11px] font-medium text-blue-400 hover:bg-blue-600/30"
            >
              <span>Open Source</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
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

  // 2. Default View: Real-Time Ingested Knowledge Base Library for this Unit
  return (
    <div className="flex h-full w-full flex-col bg-[#0b0f19] border-l border-slate-800 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-5 py-3.5 backdrop-blur-md">
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
          <p className="text-[11px] text-slate-400">Real-time vector indexing status & materials</p>
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

      {/* Helper Banner */}
      <div className="border-b border-slate-800/60 bg-blue-950/20 px-5 py-2.5 text-[11px] text-blue-300/90 flex items-center gap-2">
        <Paperclip className="h-3.5 w-3.5 text-blue-400 shrink-0" />
        <span>
          Click any <strong className="text-blue-200 font-semibold">[Slide #]</strong> badge in chat to inspect slides here.
        </span>
      </div>

      {/* Materials List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {documents.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-slate-800 bg-[#090d16]">
            <FileText className="h-10 w-10 text-slate-600 mb-2 stroke-[1.2]" />
            <p className="text-xs font-semibold text-slate-300">No Materials Ingested for {selectedUnit}</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Upload your lecture slides, course outline, or textbooks to activate unit-isolated AI citations.
            </p>
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="mt-4 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm shadow-blue-500/20"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Upload Material</span>
              </button>
            )}
          </div>
        ) : (
          documents.map((doc) => {
            const isReady = doc.is_processed && doc.chunks_indexed > 0;
            return (
              <div
                key={doc.id}
                className={`rounded-xl border p-4 transition ${
                  isReady
                    ? "border-slate-800 bg-[#0e1422] hover:border-slate-700"
                    : "border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isReady
                          ? "bg-blue-600/20 text-blue-400"
                          : "bg-amber-500/20 text-amber-400 animate-pulse"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate max-w-[280px]" title={doc.title}>
                        {doc.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">
                          {doc.page_count} pages
                        </span>
                        {doc.file_size_bytes && (
                          <>
                            <span className="text-[10px] text-slate-600">•</span>
                            <span className="text-[10px] text-slate-400">
                              {formatBytes(doc.file_size_bytes)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isReady ? (
                    <div className="flex items-center gap-1 rounded bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{doc.chunks_indexed} chunks indexed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 rounded bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 text-[10px] font-semibold text-amber-300 shrink-0">
                      <Clock className="h-3 w-3 animate-spin" />
                      <span>Indexing in background...</span>
                    </div>
                  )}
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
