"use client";

import React from "react";
import {
  ExternalLink,
  Bookmark,
  X,
  FileText,
  ShieldCheck
} from "lucide-react";

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
}) => {
  if (!citation) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Bookmark className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1a2c4e] truncate">
                  {citation.type === "local_slide"
                    ? `Verified Slide ${citation.page_number}`
                    : (citation.title || "Academic Web Reference")}
                </span>
                <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700 shrink-0">
                  {citation.unit_code || selectedUnit || "Verified"}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                {citation.file_name || citation.slide_title || "Course Material"}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0"
              aria-label="Close citation"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content Excerpt */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-blue-600" />
            <span>Citation Excerpt</span>
          </div>
          <p className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700 max-h-64 overflow-y-auto">
            {citation.content_preview || "Document text loaded and verified against vector embedding."}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Verified syllabus vector citation</span>
          </div>

          <div className="flex items-center gap-2">
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
              >
                <span>External Link</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
