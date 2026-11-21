"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, TrendingUp, Award, Clock, Sparkles, Send, CheckCircle2, BookOpen, Layers, ArrowLeft } from "lucide-react";
import { AcademicMarkdown } from "./AcademicMarkdown";

interface PastPaperModalProps {
  unitCode: string;
  isOpen?: boolean;
  onClose?: () => void;
  isPage?: boolean;
}

export const PastPaperModal: React.FC<PastPaperModalProps> = ({
  unitCode,
  isOpen = false,
  onClose,
  isPage = false,
}) => {
  const [activeTab, setActiveTab] = useState<"trend" | "solve" | "mock">("trend");
  const [questionInput, setQuestionInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Mock Exam States
  const [mockExamId, setMockExamId] = useState<string | null>(null);
  const [mockPaper, setMockPaper] = useState<string | null>(null);
  const [studentSubmission, setStudentSubmission] = useState("");
  const [evaluationResult, setEvaluationResult] = useState<string | null>(null);

  const isEffectivelyOpen = isPage || isOpen;
  if (!isEffectivelyOpen) return null;

  const handleAnalyzeTrends = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/past-papers/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_code: unitCode }),
      });
      const data = await res.json();
      setResult(data.analysis || "No analysis available.");
    } catch (e) {
      setResult("Error generating exam trend analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolveQuestion = async () => {
    if (!questionInput.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/past-papers/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_code: unitCode, question: questionInput, marks: 15 }),
      });
      const data = await res.json();
      setResult(data.model_answer || "No answer generated.");
    } catch (e) {
      setResult("Error drafting model answer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMockExam = async () => {
    setIsLoading(true);
    setMockPaper(null);
    setEvaluationResult(null);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/mock-exams/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_code: unitCode, difficulty: "University Standard Final" }),
      });
      const data = await res.json();
      if (data.exam) {
        setMockExamId(data.exam._id);
        setMockPaper(data.exam.paper_markdown);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateMockExam = async () => {
    if (!mockExamId || !studentSubmission.trim()) return;
    setIsLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/mock-exams/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: mockExamId, student_answers: studentSubmission }),
      });
      const data = await res.json();
      setEvaluationResult(data.evaluation || "Evaluation complete.");
    } catch (e) {
      setEvaluationResult("Error submitting examination for grading.");
    } finally {
      setIsLoading(false);
    }
  };

  const innerContent = (
    <div className={`flex flex-col rounded-2xl border border-slate-800 bg-[#0c111d] shadow-2xl overflow-hidden ${isPage ? "w-full max-w-7xl mx-auto min-h-[88vh]" : "h-[88vh] w-full max-w-4xl"}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0a0f1b] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Past Papers & Exam Revision Suite • <span className="text-emerald-400 font-mono">{unitCode}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Lecturer marking rubrics, exam trend predictions & realistic timed practice
              </p>
            </div>
          </div>
          {onClose && !isPage && (
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800/80 bg-[#080d17] px-6">
          <button
            onClick={() => { setActiveTab("trend"); setResult(null); }}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === "trend"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Exam Trend Predictor</span>
          </button>
          <button
            onClick={() => { setActiveTab("solve"); setResult(null); }}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === "solve"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Lecturer Marking Rubric</span>
          </button>
          <button
            onClick={() => { setActiveTab("mock"); setResult(null); }}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === "mock"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Timed Mock Exam Simulator</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "trend" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs text-slate-300">
                <p className="font-bold text-blue-300 text-sm">Topic Frequency & Probability Engine</p>
                <p className="mt-1 text-slate-400 leading-relaxed">
                  Analyzes indexed curriculum past papers for <strong>{unitCode}</strong> to identify high-yield questions likely to appear in Section A (Compulsory) and Section B.
                </p>
                <button
                  onClick={handleAnalyzeTrends}
                  disabled={isLoading}
                  className="mt-3 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50 shadow-md"
                >
                  <Sparkles className="h-4 w-4" />
                  {isLoading ? "Analyzing Exam Trends..." : `Analyze Exam Trends for ${unitCode}`}
                </button>
              </div>

              {result && (
                <div className="mt-4 rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-inner">
                  <AcademicMarkdown content={result} />
                </div>
              )}
            </div>
          )}

          {activeTab === "solve" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <label className="text-xs font-bold text-slate-200">
                  Paste Exam Question (from past paper or assignment):
                </label>
                <textarea
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="e.g. Describe the Banker's Algorithm for deadlock avoidance and calculate the safe state..."
                  className="mt-2 h-24 w-full rounded-xl border border-slate-800 bg-[#090d16] p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleSolveQuestion}
                  disabled={isLoading || !questionInput.trim()}
                  className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 shadow-md"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isLoading ? "Formulating Model Answer..." : "Draft Model Answer with Rubric"}
                </button>
              </div>

              {result && (
                <div className="mt-4 rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-inner">
                  <AcademicMarkdown content={result} />
                </div>
              )}
            </div>
          )}

          {activeTab === "mock" && (
            <div className="space-y-5">
              {!mockPaper ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
                  <Clock className="mx-auto h-12 w-12 text-blue-400 mb-3 stroke-[1.5]" />
                  <h3 className="text-base font-bold text-slate-200">Timed Mock Exam Simulator</h3>
                  <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Synthesizes a realistic 70-mark university final examination paper grounded in the course syllabus.
                  </p>
                  <button
                    onClick={handleGenerateMockExam}
                    disabled={isLoading}
                    className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50 shadow-md"
                  >
                    {isLoading ? "Generating Examination Paper..." : `Generate Mock Exam for ${unitCode}`}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* The Exam Paper */}
                  <div className="rounded-2xl border border-slate-700 bg-[#090d16] p-6 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Examination Paper: {unitCode}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Exam Ref: {mockExamId?.slice(0, 12)}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      <AcademicMarkdown content={mockPaper} />
                    </div>
                  </div>

                  {/* Student Answer Submission Box */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <label className="text-xs font-semibold text-slate-200">
                      Your Examination Answer Sheet:
                    </label>
                    <textarea
                      value={studentSubmission}
                      onChange={(e) => setStudentSubmission(e.target.value)}
                      placeholder="Type your answers here (Question 1, Question 2, Question 3). Include definitions, formulas, and trade-offs..."
                      className="mt-2 h-36 w-full rounded-xl border border-slate-800 bg-[#090d16] p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={handleEvaluateMockExam}
                        disabled={isLoading || !studentSubmission.trim()}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 shadow-md"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{isLoading ? "Grading Against University Rubric..." : "Submit for Lecturer Grading"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Evaluation Result */}
                  {evaluationResult && (
                    <div className="rounded-2xl border border-emerald-500/40 bg-[#07131a] p-6 shadow-inner">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                        Official Lecturer Evaluation & Score Breakdown:
                      </h4>
                      <AcademicMarkdown content={evaluationResult} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  );

  if (isPage) {
    return (
      <div className="min-h-screen w-full bg-[#0b1329] text-slate-100 flex flex-col">
        {/* Top Breadcrumb Bar */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b1329]/95 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Campus Home</span>
            </Link>
            <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Past Exam Questions & Trends ({unitCode})
            </span>
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
          {innerContent}
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-in fade-in">
      {innerContent}
    </div>
  );
};
