"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Compass,
  Sparkles,
  Download,
  FileText,
  Upload,
  RefreshCw,
  Send,
  Layers,
  Paperclip,
  CheckCircle2,
  FileCheck,
  Eye,
  Code,
  Shield,
  HelpCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Unit } from "./Sidebar";
import { MermaidDiagram } from "./MermaidDiagram";

interface AssignmentStudioModalProps {
  units: Unit[];
  currentUnitCode: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SolutionData {
  unit_code: string;
  target_marks: number;
  solution_markdown: string;
  mermaid_code?: string | null;
  all_diagrams?: string[];
  citations?: { document_title: string; page_number: number }[];
  viva_questions?: string[];
}

export const AssignmentStudioModal: React.FC<AssignmentStudioModalProps> = ({
  units,
  currentUnitCode,
  isOpen,
  onClose,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>(currentUnitCode || "SCS 3201");
  const [promptInput, setPromptInput] = useState<string>("");
  const [targetMarks, setTargetMarks] = useState<number>(15);
  const [diagramPref, setDiagramPref] = useState<string>("auto");
  const [notationStyle, setNotationStyle] = useState<string>("standard");

  // File Upload State
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    type: string;
    base64: string;
  } | null>(null);

  // Execution State
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [solution, setSolution] = useState<SolutionData | null>(null);
  const [activeTab, setActiveTab] = useState<"solution" | "diagrams" | "viva">("solution");
  const [refinementInput, setRefinementInput] = useState<string>("");
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentUnitObj = units.find((u) => u.code === selectedUnit) || units[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1] || result;
      setAttachedFile({
        name: file.name,
        type: file.type || "application/octet-stream",
        base64: base64Data,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSolveAssignment = async (overridePrompt?: string) => {
    const query = overridePrompt || promptInput;
    if (!query.trim() && !attachedFile) {
      alert("Please paste an assignment question or attach a file.");
      return;
    }

    setIsSynthesizing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const updatedHistory = [...chatHistory];
      if (overridePrompt) {
        updatedHistory.push({ role: "user", content: overridePrompt });
      }

      const res = await fetch(`${apiUrl}/api/assignments/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_code: selectedUnit,
          prompt: query.trim(),
          target_marks: targetMarks,
          diagram_preference: diagramPref,
          notation_style: notationStyle,
          file_base64: attachedFile?.base64,
          file_name: attachedFile?.name,
          file_type: attachedFile?.type,
          chat_history: updatedHistory.length > 0 ? updatedHistory : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to solve assignment");
      const data: SolutionData = await res.json();
      setSolution(data);
      if (data.mermaid_code) {
        setActiveTab("solution");
      }
      setChatHistory([
        ...updatedHistory,
        { role: "assistant", content: data.solution_markdown },
      ]);
      setRefinementInput("");
    } catch (e: any) {
      alert(e.message || "Failed to synthesize assignment solution.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleExport = async (format: "pdf" | "docx") => {
    if (!solution) return;
    if (format === "pdf") setIsExportingPdf(true);
    if (format === "docx") setIsExportingDocx(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const endpoint = format === "pdf" ? "/api/assignments/export-pdf" : "/api/assignments/export-docx";

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_code: selectedUnit,
          unit_name: currentUnitObj?.name || "",
          title: `${selectedUnit} Assignment Solution`,
          question: promptInput,
          solution_markdown: solution.solution_markdown,
          target_marks: targetMarks,
        }),
      });

      if (!res.ok) throw new Error(`Export to ${format.toUpperCase()} failed`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedUnit}_Assignment_Solution.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || "Export failed.");
    } finally {
      if (format === "pdf") setIsExportingPdf(false);
      if (format === "docx") setIsExportingDocx(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex h-[95vh] w-full max-w-7xl flex-col rounded-2xl border border-slate-800 bg-[#0c111d] shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#090d16] px-4 py-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Assignment & Architecture Studio
                </h2>
                <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.2 text-[10px] font-bold text-blue-400">
                  Highest Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Syllabus-grounded problem solver, interactive diagrams (DFD/ERD), and publication exports
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Studio Workspace Layout */}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          {/* Left Panel: Input & Assignment Specification */}
          <div className="w-full lg:w-[420px] border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#090d16] p-4 sm:p-5 flex flex-col justify-between overflow-y-auto shrink-0">
            <div className="space-y-4">
              {/* Unit Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Course Unit
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0c111d] px-3 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none transition"
                >
                  {units.map((u) => (
                    <option key={u.code} value={u.code}>
                      {u.code}: {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mark Allocation & Depth Guide */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Grading Allocation
                  </label>
                  <span className="text-[10px] text-blue-400 font-mono font-bold">
                    {targetMarks} Marks Rubric
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 20].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTargetMarks(m)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                        targetMarks === m
                          ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                          : "border-slate-800 bg-[#0c111d] text-slate-400 hover:text-white"
                      }`}
                    >
                      {m} Mks
                    </button>
                  ))}
                </div>
              </div>

              {/* Technical Diagram Specification */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Technical Diagram Engine
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "auto", label: "Auto-Detect" },
                    { id: "dfd", label: "DFD (L0/L1)" },
                    { id: "erd", label: "ERD Schema" },
                    { id: "architecture", label: "Architecture" },
                    { id: "uml", label: "UML Class" },
                    { id: "none", label: "Text Only" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDiagramPref(d.id)}
                      className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border transition truncate ${
                        diagramPref === d.id
                          ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                          : "border-slate-800 bg-[#0c111d] text-slate-400 hover:text-white"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Text Prompt */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Assignment Question / Problem Statement
                </label>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Paste your assignment prompt, algorithm problem, or system design scenario..."
                  rows={6}
                  className="w-full rounded-xl border border-slate-800 bg-[#0c111d] p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed transition"
                />
              </div>

              {/* File Attachment Area */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt,.docx,.doc"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {attachedFile ? (
                  <div className="flex items-center justify-between rounded-xl border border-blue-500/40 bg-blue-950/20 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="h-4 w-4 text-blue-400 shrink-0" />
                      <span className="text-xs text-blue-200 truncate font-medium">
                        {attachedFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="text-slate-400 hover:text-rose-400 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-[#0c111d] py-2.5 text-xs text-slate-400 hover:text-white transition"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Attach Assignment Sheet (PDF, Image, Word)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 mt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleSolveAssignment()}
                disabled={isSynthesizing || (!promptInput.trim() && !attachedFile)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-40 cursor-pointer"
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Synthesizing Grounded Solution...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-white" />
                    <span>Synthesize Solution & Diagrams</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Solution, Live Diagram Studio & Refinements */}
          <div className="flex flex-1 flex-col bg-[#0c111d] overflow-hidden min-w-0">
            {/* Top Workspace Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#090d16] px-4 py-2.5 shrink-0">
              {/* Tab Selector */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("solution")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === "solution"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Solution & Proofs
                </button>

                {solution?.mermaid_code && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("diagrams")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeTab === "diagrams"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5 text-blue-400" />
                    <span>Visual Diagrams</span>
                  </button>
                )}

                {solution?.viva_questions && solution.viva_questions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("viva")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeTab === "viva"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Viva Defense Prep
                  </button>
                )}
              </div>

              {/* Action Buttons: Export PDF & Word */}
              {solution && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExport("docx")}
                    disabled={isExportingDocx}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
                    title="Export ready-to-edit Microsoft Word document"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-400" />
                    <span>{isExportingDocx ? "Exporting..." : "Word (.docx)"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExport("pdf")}
                    disabled={isExportingPdf}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                    title="Export clean publication-grade PDF"
                  >
                    <Download className="h-3.5 w-3.5 text-white" />
                    <span>{isExportingPdf ? "Generating..." : "PDF"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Main Content Arena */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {!solution ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mb-4">
                    <Compass className="h-8 w-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">Assignment Studio Ready</h3>
                  <p className="mt-1 max-w-md text-xs text-slate-400 leading-relaxed">
                    Paste your assignment question on the left or attach a PDF/screenshot. EduRAG will synthesize a course-grounded derivation, generate technical diagrams (DFDs/ERDs), and provide submission-ready exports.
                  </p>
                </div>
              ) : activeTab === "solution" ? (
                <div className="max-w-4xl mx-auto space-y-4">
                  {/* Citations Banner */}
                  {solution.citations && solution.citations.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-[#090d16] p-3 text-xs text-slate-400 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-slate-300">Grounded in lecture slides:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {solution.citations.slice(0, 3).map((c, i) => (
                          <span
                            key={i}
                            className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 font-mono"
                          >
                            {c.document_title} (p. {c.page_number})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mermaid Diagram Banner (if present) */}
                  {solution.mermaid_code && (
                    <MermaidDiagram
                      chart={solution.mermaid_code}
                      title={`${selectedUnit} Technical Diagram`}
                    />
                  )}

                  {/* Markdown Solution Body */}
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#090d16] p-6 rounded-2xl border border-slate-800">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {solution.solution_markdown}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : activeTab === "diagrams" ? (
                <div className="max-w-4xl mx-auto space-y-4">
                  {solution.mermaid_code ? (
                    <MermaidDiagram
                      chart={solution.mermaid_code}
                      title={`${selectedUnit} Technical Architecture`}
                    />
                  ) : (
                    <p className="text-xs text-slate-400">No visual diagrams generated for this query.</p>
                  )}
                </div>
              ) : (
                /* Viva Defense Prep Tab */
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                      <HelpCircle className="h-4 w-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Viva / Defense Preparation
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300">
                      If your course lecturer or TA asks you to defend this assignment submission in lab or oral viva, review these 3 critical questions:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {solution.viva_questions?.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-800 bg-[#090d16] p-4 text-xs text-slate-300"
                      >
                        <span className="font-bold text-blue-400 block mb-1">Defense Probe #{idx + 1}:</span>
                        <p className="leading-relaxed">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Multi-Turn Chat Refinement Input (Always visible when solution exists) */}
            {solution && (
              <div className="border-t border-slate-800 bg-[#090d16] p-3 sm:p-4 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!refinementInput.trim() || isSynthesizing) return;
                    handleSolveAssignment(refinementInput);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0c111d] px-3 py-1.5 focus-within:border-blue-500 transition"
                >
                  <input
                    type="text"
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    placeholder="Refine solution or diagram (e.g. 'Add Level-1 DFD for payments' or 'Expand mathematical proof')..."
                    className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!refinementInput.trim() || isSynthesizing}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
