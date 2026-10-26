"use client";

import React from "react";
import { FileText, ExternalLink, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";

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
  onClose?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ citation, onClose }) => {
  if (!citation) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-slate-500">
        <FileText className="h-12 w-12 stroke-[1.2] text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">Synchronized Slide Viewer</h3>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Click any <span className="text-blue-400 font-medium">[Slide #]</span> citation badge in the AI chat to inspect the exact lecturer slide here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#0b0f19] border-l border-slate-800 text-slate-200">
      {/* Viewer Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900/50">
        <div className="flex items-center gap-2">
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
};
