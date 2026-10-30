"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  FileCheck2,
  Sparkles,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Layers,
  ChevronRight,
  BookOpen
} from "lucide-react";

interface DocumentPipelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: { code: string; name: string }[];
  initialUnit?: string;
}

export const DocumentPipelinesModal: React.FC<DocumentPipelinesModalProps> = ({
  isOpen,
  onClose,
  units,
  initialUnit = "SCS 3201",
}) => {
  const [activeTab, setActiveTab] = useState<"auto_answer" | "uon_simulate">("auto_answer");
  const [selectedUnit, setSelectedUnit] = useState<string>(initialUnit);

  // --- Feature 1: Auto-Answer Generator State ---
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [solveStatusMessage, setSolveStatusMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Feature 2: UON Exam Simulator State ---
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTaskId, setSimulationTaskId] = useState<string | null>(null);
  const [simulationProgress, setSimulationProgress] = useState("");
  const [isSimulationReady, setIsSimulationReady] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Reset or initialize unit
  useEffect(() => {
    if (initialUnit) setSelectedUnit(initialUnit);
  }, [initialUnit]);

  // Polling mechanism for Feature 2 Background Task
  useEffect(() => {
    if (!simulationTaskId || !isSimulating) return;

    const interval = setInterval(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
        const res = await fetch(`${apiUrl}/api/v1/exams/status/${simulationTaskId}`);
        if (!res.ok) throw new Error("Status check failed");
        const data = await res.json();

        setSimulationProgress(data.progress || "Processing paper...");

        if (data.status === "completed") {
          setIsSimulating(false);
          setIsSimulationReady(true);
          clearInterval(interval);
        } else if (data.status === "failed") {
          setIsSimulating(false);
          setSimulationError(data.error || "Simulation failed.");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [simulationTaskId, isSimulating]);

  if (!isOpen) return null;

  // --- Handler 1: Trigger Auto-Answer Pipeline ---
  const handleSolvePaper = async () => {
    if (!uploadedFile) {
      alert("Please upload a revision paper PDF first.");
      return;
    }

    setIsSolving(true);
    setSolveStatusMessage("Extracting questions via Gemini 1.5 Flash, searching notes & generating full answers via GPT-4o...");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const formData = new FormData();
      formData.append("unit_code", selectedUnit);
      formData.append("file", uploadedFile);

      const res = await fetch(`${apiUrl}/api/v1/exams/solve-paper`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to solve revision paper.");
      }

      setSolveStatusMessage("Rendering WeasyPrint PDF layout...");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Solved_${selectedUnit.replace(/\s+/g, "_")}_Revision_Paper.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setSolveStatusMessage("Solved Answer Sheet PDF downloaded successfully!");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "An error occurred during paper resolution.");
    } finally {
      setIsSolving(false);
    }
  };

  // --- Handler 2: Trigger UON Exam Simulator Pipeline ---
  const handleSimulateExam = async () => {
    setIsSimulating(true);
    setIsSimulationReady(false);
    setSimulationError(null);
    setSimulationTaskId(null);
    setSimulationProgress("Dispatching asynchronous simulation task to FastAPI...");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/v1/exams/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_code: selectedUnit,
          semester: "First Semester",
          academic_year: "2025/2026",
        }),
      });

      if (!res.ok) throw new Error("Could not start exam simulation task.");
      const data = await res.json();
      setSimulationTaskId(data.task_id);
      setSimulationProgress("Absorbing full semester syllabus and 3 past paper templates via Gemini 1.5 Pro...");
    } catch (e: any) {
      console.error(e);
      setIsSimulating(false);
      setSimulationError(e.message || "Failed to initiate simulation.");
    }
  };

  // --- Handler 3: Download Simulated Exam PDF ---
  const handleDownloadSimulatedPdf = () => {
    if (!simulationTaskId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
    window.open(`${apiUrl}/api/v1/exams/download/${simulationTaskId}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-800 bg-[#0a0f1d] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d1424] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Automated Examination PDF Pipelines
              </h2>
              <p className="text-xs text-slate-400">
                Asynchronous document pipelines powered by Gemini 1.5, OpenAI GPT-4o, Jinja2, and WeasyPrint.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pipeline Mode Switcher */}
        <div className="flex border-b border-slate-800 bg-[#080d18] px-6 pt-2">
          <button
            onClick={() => setActiveTab("auto_answer")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
              activeTab === "auto_answer"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Feature 1: Auto-Answer PDF Generator</span>
          </button>

          <button
            onClick={() => setActiveTab("uon_simulate")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
              activeTab === "uon_simulate"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCheck2 className="h-4 w-4" />
            <span>Feature 2: UON Exam Simulator (Async)</span>
          </button>
        </div>

        {/* Global Unit Selector */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0c1220] px-6 py-3 text-xs">
          <span className="font-semibold text-slate-300">Target Academic Unit:</span>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white focus:border-blue-500 focus:outline-none"
          >
            {units.map((u) => (
              <option key={u.code} value={u.code}>
                {u.code}: {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pipeline Workspaces */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#070b14]">
          {/* =========================================================================
              FEATURE 1: AUTO-ANSWER PDF GENERATOR WORKSPACE
             ========================================================================= */}
          {activeTab === "auto_answer" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 text-xs text-blue-200 leading-relaxed">
                <p className="font-bold text-white mb-1">How Feature 1 Works:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Upload your blank university revision paper (PDF).</li>
                  <li>Gemini 1.5 Flash extracts questions, mathematical formulas, and structure.</li>
                  <li>Supabase pgvector retrieves matching lecture notes and textbook chunks for {selectedUnit}.</li>
                  <li>OpenAI GPT-4o (with instant failover to GPT-4 Turbo) writes detailed, multi-paragraph working.</li>
                  <li>WeasyPrint converts the custom Jinja2 HTML (dark blue question cards & green-bordered answers) into a downloadable PDF.</li>
                </ol>
              </div>

              {/* Drag-and-Drop / File Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
                  uploadedFile
                    ? "border-emerald-500/50 bg-emerald-950/10"
                    : "border-slate-700 hover:border-blue-500 bg-[#090d18]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setUploadedFile(f);
                  }}
                />

                {uploadedFile ? (
                  <div className="space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                      <FileCheck2 className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-white">{uploadedFile.name}</p>
                    <p className="text-xs text-emerald-400 font-semibold">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Ready for Processing
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-400 underline pt-2"
                    >
                      Remove and choose another
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-white">Click or drag a blank revision paper here</p>
                    <p className="text-xs text-slate-400">PDF files up to 25MB supported</p>
                  </div>
                )}
              </div>

              {/* Status Banner */}
              {solveStatusMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-200">
                  {isSolving ? (
                    <RefreshCw className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  <span>{solveStatusMessage}</span>
                </div>
              )}

              {/* Dedicated Action Button */}
              <button
                onClick={handleSolvePaper}
                disabled={isSolving || !uploadedFile}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition active:scale-95 disabled:opacity-50"
              >
                {isSolving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Executing Pipeline (Asynchronously Solving)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Answers & Download PDF</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* =========================================================================
              FEATURE 2: UON EXAM SIMULATOR (ASYNC BACKGROUND TASK + POLLING)
             ========================================================================= */}
          {activeTab === "uon_simulate" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-200 leading-relaxed">
                <p className="font-bold text-white mb-1">How Feature 2 Works:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Triggers <code>POST /api/v1/exams/simulate</code> which responds instantly with <code>task_id</code>.</li>
                  <li>FastAPI <code>BackgroundTasks</code> runs asynchronously for 30–60 seconds.</li>
                  <li>Gemini 1.5 Pro absorbs your full semester notes and 3 historical past paper templates.</li>
                  <li>Outputs a strict JSON array of realistic UON questions formatted like an official 70-mark paper.</li>
                  <li>Renders the Jinja2 formal exam template to PDF via WeasyPrint.</li>
                  <li>Real-time status polling reveals the download button the second it's ready.</li>
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#090d18] p-6 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-lg">
                  <FileCheck2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    University of Nairobi Examination Simulator
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Synthesizes a brand new, realistic examination paper for <b>{selectedUnit}</b> adhering strictly to Chiromo academic regulations.
                  </p>
                </div>

                {/* Polling / Progress Indicator */}
                {isSimulating && (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-center gap-2 text-blue-300 font-semibold">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{simulationProgress}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Background Task ID: {simulationTaskId} (Polling every 2.5s)
                    </p>
                  </div>
                )}

                {/* Error Banner */}
                {simulationError && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{simulationError}</span>
                  </div>
                )}

                {/* Success Card with Reveal Download Button */}
                {isSimulationReady && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-5 space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Simulation Complete! Official UON Paper Ready</span>
                    </div>
                    <button
                      onClick={handleDownloadSimulatedPdf}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Simulated UON Exam Paper (PDF)</span>
                    </button>
                  </div>
                )}

                {/* Dedicated Trigger Button */}
                {!isSimulationReady && (
                  <button
                    onClick={handleSimulateExam}
                    disabled={isSimulating}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Background Task Running...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="h-4 w-4" />
                        <span>Generate UON Exam Simulator</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
