"use client";

import React, { useState } from "react";
import { X, UploadCloud, CheckCircle2, AlertCircle, FileText, Check } from "lucide-react";
import { Unit } from "./Sidebar";

interface UploadModalProps {
  units: Unit[];
  selectedUnit: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  units,
  selectedUnit,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [targetUnit, setTargetUnit] = useState(selectedUnit);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
    isIndexing?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append("unit_code", targetUnit);
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        const isIndexing = data.status === "indexing";
        setStatusMsg({
          type: "success",
          isIndexing,
          text: isIndexing
            ? `✓ ${data.slides_extracted || "Document"} pages received! Vector indexing is running in the background. You can close this window and start asking questions in chat.`
            : `✓ Successfully extracted & indexed ${data.slides_extracted} slides (${data.chunks_indexed} vector chunks). Ready for questions!`,
        });
        setFile(null);
        if (onSuccess) onSuccess();
      } else {
        setStatusMsg({
          type: "error",
          text: data.detail || "Failed to process document.",
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Network error uploading file. For large textbooks (20MB+), consider uploading by chapter.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setStatusMsg(null);
    setFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c111d] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
              <UploadCloud className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Upload Course Material</h3>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Target Academic Unit:</label>
            <select
              value={targetUnit}
              onChange={(e) => setTargetUnit(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-800 bg-[#090d16] p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              {units.map((u) => (
                <option key={u.code} value={u.code}>
                  {u.code} — {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">
              Lecture Slides / Textbooks / Past Papers (.pdf, .pptx, .docx):
            </label>
            <div className="mt-1.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/30 p-6 text-center hover:border-slate-700">
              <FileText className="h-8 w-8 text-slate-500 mb-2" />
              <input
                type="file"
                accept=".pdf,.pptx,.ppt,.docx,.doc"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setStatusMsg(null);
                }}
                className="text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-500"
              />
              <p className="mt-2 text-[11px] text-slate-500">
                Supports single slides, assignment briefs, and full 1,500-page textbooks
              </p>
            </div>
          </div>

          {file && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-300 flex items-center justify-between">
              <span className="truncate">{file.name}</span>
              <span className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}

          {statusMsg && (
            <div
              className={`rounded-lg p-3 text-xs flex items-start gap-2.5 leading-relaxed ${
                statusMsg.type === "success"
                  ? "border border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                  : "border border-rose-500/30 bg-rose-950/20 text-rose-400"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {statusMsg?.type === "success" ? (
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm shadow-emerald-600/20"
              >
                <Check className="h-4 w-4" />
                Done / Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file || isUploading}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isUploading ? "Extracting & Embedding..." : "Ingest Document"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
