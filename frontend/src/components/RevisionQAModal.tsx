"use client";

import React, { useState } from "react";
import {
  X,
  FileQuestion,
  Sparkles,
  Download,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Layers,
  ArrowRight,
  GraduationCap
} from "lucide-react";
import { Unit } from "./Sidebar";

interface RevisionQAModalProps {
  units: Unit[];
  currentUnitCode: string;
  isOpen: boolean;
  onClose: () => void;
}

interface QAResponseData {
  unit_code: string;
  unit_name: string;
  topic: string;
  question: string;
  model_answer: string;
  marking_rubric: { marks: string; criterion: string }[];
  common_pitfalls: string;
  citations: { document_title: string; page_number: number }[];
}

export const RevisionQAModal: React.FC<RevisionQAModalProps> = ({
  units,
  currentUnitCode,
  isOpen,
  onClose,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>(currentUnitCode || "SCS 3201");
  const [questionInput, setQuestionInput] = useState<string>("");
  const [topicInput, setTopicInput] = useState<string>("");
  const [targetMarks, setTargetMarks] = useState<number>(15);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [qaResult, setQaResult] = useState<QAResponseData | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSynthesizeQA = async () => {
    if (!questionInput.trim()) {
      alert("Please enter or paste your revision question.");
      return;
    }

    setIsSynthesizing(true);
    setQaResult(null);
    setPdfBase64(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/revision-qa/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_code: selectedUnit,
          question: questionInput.trim(),
          topic: topicInput.trim() || undefined,
          target_marks: targetMarks,
        }),
      });

      if (!res.ok) throw new Error("Failed to synthesize revision QA");
      const data = await res.json();
      if (data.qa_data) {
        setQaResult(data.qa_data);
        setPdfBase64(data.pdf_base64);
      }
    } catch (e) {
      console.error("QA generation failed:", e);
      alert("Error synthesizing answer from notes. Please check connection.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfBase64) return;
    try {
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EduRAG_${selectedUnit.replace(" ", "_")}_Model_QA_Compendium.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
      alert("Failed to download PDF.");
    }
  };

  const sampleQuestions: Record<string, string[]> = {
    "SCS 3201": [
      "Explain the fundamental differences between structured Systems Analysis (Kendall & Kendall) and Object-Oriented Analysis (UML).",
      "Draw and explain a Level 1 Data Flow Diagram (DFD) for an online university registration system, citing all boundary entities.",
      "Compare Fact-Finding techniques: Questionnaires vs. Personal Interviews. Under what project conditions should each be prioritized?",
    ],
    "SCS 3207": [
      "Prove Coffman's four conditions for deadlock and contrast Deadlock Avoidance (Banker's Algorithm) with Deadlock Detection.",
      "Explain virtual memory paging with a Translation Lookaside Buffer (TLB). Calculate Effective Access Time given 90% hit ratio.",
      "Contrast Preemptive Shortest Job First (SJF) with Round Robin scheduling in terms of turnaround time and starvation risk.",
    ],
    "SCS 3209": [
      "Differentiate between Functional and Non-Functional requirements in Sommerville Software Engineering with 3 technical examples each.",
      "Explain the Agile Scrum framework: Sprints, Daily Standup, Sprint Review, and Retrospective with roles defined.",
      "Derive McCabe's Cyclomatic Complexity for a decision algorithm and explain its role in basis path testing.",
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-800 bg-[#0a0f1d] shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d1424] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FileQuestion className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Intelligent Revision Q&A Companion
                </h2>
                <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  Split Question-Answer Synthesizer
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Feed any revision or past paper question. EduRAG answers as expected using notes and automatically generates a companion Q&A document + PDF.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close Revision Q&A"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Split Screen Workstation */}
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {/* Left Column: Question Input & Controls */}
          <div className="w-full md:w-5/12 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 bg-[#090d18] p-4 sm:p-5 overflow-y-auto">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-[10px] font-bold">1</span>
              <span>Feed Revision Question</span>
            </h3>

            {/* Unit Selector */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Unit</label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                >
                  {units.map((u) => (
                    <option key={u.code} value={u.code}>
                      {u.code}: {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic & Target Marks */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Topic / Chapter</label>
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="e.g. Deadlocks, DFDs"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Exam Marks Value</label>
                  <select
                    value={targetMarks}
                    onChange={(e) => setTargetMarks(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value={5}>5 Marks (Short Definition)</option>
                    <option value={10}>10 Marks (Detailed Concept)</option>
                    <option value={15}>15 Marks (Full Analysis / Proof)</option>
                    <option value={20}>20 Marks (Major Section Question)</option>
                  </select>
                </div>
              </div>

              {/* Question Text Area */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Revision Question / Problem Statement
                </label>
                <textarea
                  rows={6}
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="Paste past paper problem, assignment question, or complex revision question here..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Fast Example Prompts */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Or Load Syllabus Past Exam Question:
                </span>
                <div className="space-y-1.5">
                  {(sampleQuestions[selectedUnit] || sampleQuestions["SCS 3201"]).map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuestionInput(q)}
                      className="w-full text-left rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-[11px] text-slate-300 hover:border-slate-700 hover:text-white transition flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{q}</span>
                      <ArrowRight className="h-3 w-3 text-blue-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleSynthesizeQA}
                disabled={isSynthesizing || !questionInput.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition active:scale-95 disabled:opacity-50"
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Synthesizing Expected Model Answer...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Answer as Expected & Generate Companion PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Intelligent Solution & Companion Document Display */}
          <div className="w-full md:w-7/12 flex flex-col bg-[#070b14] overflow-hidden">
            {qaResult ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Companion Action Ribbon */}
                <div className="flex items-center justify-between border-b border-slate-800 bg-[#0c1220] px-5 py-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600 text-[10px] font-bold text-white">2</span>
                    <span className="font-bold text-white">Generated Companion Document</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400 font-semibold">{qaResult.unit_code}</span>
                  </div>

                  {pdfBase64 && (
                    <button
                      onClick={handleDownloadPdf}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition"
                      title="Download clean, publication-ready PDF with question, model answer, rubric, and citations"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Companion PDF</span>
                    </button>
                  )}
                </div>

                {/* Companion Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                  {/* Question Fed Card */}
                  <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                      Question Fed by Student:
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                      {qaResult.question}
                    </p>
                  </div>

                  {/* Comprehensive Model Answer */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Expected Lecturer Model Answer (Syllabus-Aligned):</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {qaResult.model_answer}
                    </div>
                  </div>

                  {/* Point-by-Point Marking Rubric */}
                  {qaResult.marking_rubric && qaResult.marking_rubric.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-[#0e1424] p-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">
                        Marking Scheme & Point Allocations:
                      </h4>
                      <div className="space-y-1.5">
                        {qaResult.marking_rubric.map((r, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/80 p-2 text-xs"
                          >
                            <span className="text-slate-300">{r.criterion}</span>
                            <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800/40 shrink-0 ml-3">
                              {r.marks}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common Pitfalls Card */}
                  {qaResult.common_pitfalls && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Lecturer Traps & Student Mistakes to Avoid:</span>
                      </div>
                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        {qaResult.common_pitfalls}
                      </p>
                    </div>
                  )}

                  {/* Grounding Citations */}
                  {qaResult.citations && qaResult.citations.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-400">
                      <span className="font-bold text-slate-300">Grounding Lecture Citations:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-400">
                        {qaResult.citations.map((c, idx) => (
                          <li key={idx}>
                            {c.document_title} (Page / Slide {c.page_number})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-4 shadow-xl">
                  <FileQuestion className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-white">No Revision Question Evaluated Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  Paste any revision question on the left panel. EduRAG will analyze your unit's notes, generate the exact expected model answer, outline the marking scheme, and compile a side-by-side downloadable PDF compendium.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
