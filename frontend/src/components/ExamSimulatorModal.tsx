"use client";

import React, { useState } from "react";
import {
  X,
  FileCheck2,
  Download,
  Printer,
  Sparkles,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Award,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight
} from "lucide-react";
import { Unit } from "./Sidebar";

interface ExamSimulatorModalProps {
  units: Unit[];
  currentUnitCode: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SubQuestion {
  label: string;
  text: string;
  marks: number;
  model_answer?: string;
  citation?: string;
}

interface Question {
  question_number: string;
  is_compulsory: boolean;
  total_marks: number;
  stem: string;
  sub_questions: SubQuestion[];
}

interface ExamData {
  unit_code: string;
  unit_name: string;
  academic_year: string;
  semester: string;
  time_allowed: string;
  instructions: string;
  questions: Question[];
}

export const ExamSimulatorModal: React.FC<ExamSimulatorModalProps> = ({
  units,
  currentUnitCode,
  isOpen,
  onClose,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>(currentUnitCode || "SCS 3201");
  const [examType, setExamType] = useState<string>("Final Examination");
  const [difficulty, setDifficulty] = useState<string>("Chiromo Standard Exam");
  const [includeAnswers, setIncludeAnswers] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [showAnswerKeys, setShowAnswerKeys] = useState<boolean>(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentUnitObj = units.find((u) => u.code === selectedUnit) || units[0];

  const handleGenerateExam = async () => {
    setIsGenerating(true);
    setCurrentExamId(null);
    setExamData(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/mock-exams/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_code: selectedUnit,
          difficulty: difficulty,
          exam_type: examType,
          include_answers: includeAnswers,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate simulated exam");
      const data = await res.json();
      if (data.exam && data.exam.exam_data) {
        setCurrentExamId(data.exam._id);
        setExamData(data.exam.exam_data);
      }
    } catch (e) {
      console.error("Exam generation error:", e);
      alert("Error generating full examination. Please verify backend connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async (answers: boolean) => {
    if (!currentExamId) return;
    setIsDownloadingPdf(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${apiUrl}/api/mock-exams/${currentExamId}/pdf?include_answers=${answers}`,
        { method: "GET" }
      );
      if (!res.ok) throw new Error("Failed to fetch exam PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `UoN_${selectedUnit.replace(" ", "_")}_Simulated_Exam_${answers ? "With_Answers" : "Questions_Only"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download error:", e);
      alert("Could not download exam PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-800 bg-[#0a0f1d] shadow-2xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d1424] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Autonomous Exam Simulation Suite
                </h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  UoN 70-Mark Standard
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Generate full, complete university examination papers grounded in lecture notes & past papers with complete model answer keys.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close Exam Suite"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Generator Controls Shelf */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border-b border-slate-800 bg-[#090e1a] p-3 sm:p-4 text-xs">
          {/* Unit Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Select Academic Unit</label>
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

          {/* Assessment Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Assessment Format</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Final Examination">Final University Exam (70 Marks)</option>
              <option value="Continuous Assessment Test I">CAT I Examination (30 Marks)</option>
              <option value="Continuous Assessment Test II">CAT II Examination (30 Marks)</option>
              <option value="Special Supplementary">Special / Supplementary Exam</option>
            </select>
          </div>

          {/* Difficulty Standard */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Rigor & Caliber</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Chiromo Standard Exam">Chiromo Standard (Balanced)</option>
              <option value="Rigorous High-Distinction (First Class)">Rigorous High-Distinction (First Class)</option>
              <option value="Essential Pass-Shield (Foundational)">Essential Pass-Shield (Foundational)</option>
            </select>
          </div>

          {/* Model Answer Toggle */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 border border-slate-800 rounded-lg p-2">
              <input
                type="checkbox"
                checked={includeAnswers}
                onChange={(e) => setIncludeAnswers(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-blue-600 focus:ring-0"
              />
              <span className="text-[11px] font-medium text-slate-300">
                Embed Complete Answer Key & Marking Schemes
              </span>
            </label>
          </div>

          {/* Trigger Button */}
          <div className="flex items-end">
            <button
              onClick={handleGenerateExam}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Exam...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Complete Paper</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Paper Display & PDF Viewport */}
        <div className="flex flex-1 overflow-hidden bg-[#070b14]">
          {examData ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Exam Actions Ribbon */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-[#0c1220] px-6 py-2.5 gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Award className="h-4 w-4 text-emerald-400" />
                  <span>{examData.unit_code}: {examData.unit_name}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400">{examData.time_allowed}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-blue-400">70 Marks Total</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAnswerKeys(!showAnswerKeys)}
                    className={`rounded-lg border px-3 py-1 text-[11px] font-semibold transition ${
                      showAnswerKeys
                        ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    {showAnswerKeys ? "Hide Model Answers" : "Show Model Answers"}
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(false)}
                    disabled={isDownloadingPdf}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-200 transition"
                    title="Download clean student exam paper without answers"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-400" />
                    <span>PDF (Exam Only)</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(true)}
                    disabled={isDownloadingPdf}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1 text-[11px] font-bold text-white shadow-sm transition"
                    title="Download complete exam paper with step-by-step marking schemes and model solutions"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>PDF (Full Exam + Solutions)</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Paper View */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-[#0d1424] p-6 sm:p-10 shadow-xl space-y-6">
                  {/* Official Header */}
                  <div className="text-center space-y-1 border-b border-slate-800/80 pb-6">
                    <p className="text-sm font-extrabold uppercase tracking-widest text-slate-200">
                      University of Nairobi
                    </p>
                    <p className="text-xs text-slate-400">
                      Faculty of Science and Technology • Department of Computing and Informatics
                    </p>
                    <p className="text-xs text-slate-400">
                      University Examinations {examData.academic_year} • {examData.semester}
                    </p>
                    <h1 className="text-lg sm:text-xl font-bold text-blue-400 mt-2">
                      {examData.unit_code}: {examData.unit_name.toUpperCase()}
                    </h1>
                  </div>

                  {/* Meta Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Time Allowed</span>
                      <strong className="text-white">{examData.time_allowed}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Total Marks</span>
                      <strong className="text-emerald-400">70 MARKS</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block text-[10px] text-slate-500 uppercase">Instructions</span>
                      <span className="text-[11px]">{examData.instructions}</span>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-8 pt-4">
                    {examData.questions.map((q, qIndex) => (
                      <div key={qIndex} className="space-y-4 rounded-xl border border-slate-800/80 bg-slate-900/30 p-5">
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{q.question_number}</span>
                            <span className="text-xs font-semibold text-slate-400">[{q.total_marks} Marks]</span>
                          </h3>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              q.is_compulsory
                                ? "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                                : "bg-blue-950/60 text-blue-300 border border-blue-800/40"
                            }`}
                          >
                            {q.is_compulsory ? "Compulsory" : "Elective"}
                          </span>
                        </div>

                        {q.stem && (
                          <p className="text-xs text-slate-300 italic">{q.stem}</p>
                        )}

                        <div className="space-y-4 pl-2">
                          {q.sub_questions.map((sub, sIndex) => (
                            <div key={sIndex} className="space-y-2">
                              <div className="flex items-start justify-between gap-3 text-xs text-slate-200">
                                <div className="flex items-start gap-2">
                                  <strong className="text-blue-400">{sub.label}</strong>
                                  <p className="leading-relaxed">{sub.text}</p>
                                </div>
                                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 shrink-0">
                                  {sub.marks}M
                                </span>
                              </div>

                              {/* Model Answer Box */}
                              {showAnswerKeys && sub.model_answer && (
                                <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1.5 text-xs text-emerald-200">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>Model Solution & Marking Points [{sub.marks}M]</span>
                                    </span>
                                    {sub.citation && (
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        Grounding: {sub.citation}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-emerald-100 leading-relaxed whitespace-pre-wrap pl-1">
                                    {sub.model_answer}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-6 border-t border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    === END OF EXAMINATION PAPER ===
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 mb-4 shadow-xl">
                <FileCheck2 className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-white">No Exam Paper Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Select your unit above and click <b>"Generate Complete Paper"</b>. EduRAG will autonomously draft a rigorous, 70-mark Chiromo examination grounded in your real textbooks and past exams, with full downloadable PDFs and model solutions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
