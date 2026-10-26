"use client";

import React, { useState } from "react";
import { X, TrendingUp, Award, Clock, Sparkles, Send, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PastPaperModalProps {
  unitCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PastPaperModal: React.FC<PastPaperModalProps> = ({
  unitCode,
  isOpen,
  onClose,
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

  if (!isOpen) return null;

  const handleAnalyzeTrends = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/mock-exams/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_code: unitCode, difficulty: "Chiromo Standard Final" }),
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/mock-exams/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: mockExamId, student_submission: studentSubmission }),
      });
      const data = await res.json();
      setEvaluationResult(data.evaluation || "No evaluation generated.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex h-[88vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-800 bg-[#0c111d] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Past Papers & Exam Suite • {unitCode}
              </h2>
              <p className="text-xs text-slate-400">
                UoN Lecturer marking schemes, exam trend predictor & mock simulator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800/80 px-6">
          <button
            onClick={() => { setActiveTab("trend"); setResult(null); }}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition ${
              activeTab === "trend"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Mode A: Predict & Trend</span>
          </button>
          <button
            onClick={() => { setActiveTab("solve"); setResult(null); }}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition ${
              activeTab === "solve"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Mode B: Model Marking Scheme</span>
          </button>
          <button
            onClick={() => { setActiveTab("mock"); setResult(null); }}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition ${
              activeTab === "mock"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Mode C: Mock Exam Simulator</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "trend" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs text-slate-300">
                <p className="font-semibold text-blue-400">Topic Frequency & Probability Engine</p>
                <p className="mt-1 text-slate-400">
                  Analyzes indexed Chiromo past papers for {unitCode} to predict which topics will appear in Section A (Compulsory) and Section B.
                </p>
                <button
                  onClick={handleAnalyzeTrends}
                  disabled={isLoading}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {isLoading ? "Analyzing Exam Trends..." : `Run Trend Analysis for ${unitCode}`}
                </button>
              </div>

              {result && (
                <div className="mt-4 rounded-xl border border-slate-800 bg-[#090d16] p-5 shadow-inner">
                  <div className="prose prose-invert max-w-none text-xs text-slate-300">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "solve" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <label className="text-xs font-semibold text-slate-300">
                  Paste Exam Question (from past paper or CAT):
                </label>
                <textarea
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="e.g. Describe the Banker's Algorithm for deadlock avoidance and calculate the safe state..."
                  className="mt-2 h-24 w-full rounded-lg border border-slate-800 bg-[#090d16] p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleSolveQuestion}
                  disabled={isLoading || !questionInput.trim()}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isLoading ? "Formulating Model Answer..." : "Draft Lecturer-Grade Model Answer"}
                </button>
              </div>

              {result && (
                <div className="mt-4 rounded-xl border border-slate-800 bg-[#090d16] p-5 shadow-inner">
                  <div className="prose prose-invert max-w-none text-xs text-slate-300">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "mock" && (
            <div className="space-y-5">
              {!mockPaper ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
                  <Clock className="mx-auto h-10 w-10 text-blue-400 mb-2 stroke-[1.5]" />
                  <h3 className="text-sm font-bold text-slate-200">Timed Mock Exam Simulator</h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                    Generates a full 70-mark Chiromo-standard examination paper stored into MongoDB.
                  </p>
                  <button
                    onClick={handleGenerateMockExam}
                    disabled={isLoading}
                    className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? "Generating Examination Paper..." : `Generate Chiromo Mock Exam for ${unitCode}`}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* The Exam Paper */}
                  <div className="rounded-xl border border-slate-700 bg-[#090d16] p-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                      <span className="text-xs font-bold text-blue-400">Examination Paper: {unitCode}</span>
                      <span className="text-[10px] text-slate-500">Stored in MongoDB ID: {mockExamId}</span>
                    </div>
                    <div className="prose prose-invert max-w-none text-xs text-slate-300 max-h-60 overflow-y-auto">
                      <ReactMarkdown>{mockPaper}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Student Answer Submission Box */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <label className="text-xs font-semibold text-slate-300">
                      Your Examination Answer Sheet:
                    </label>
                    <textarea
                      value={studentSubmission}
                      onChange={(e) => setStudentSubmission(e.target.value)}
                      placeholder="Type your answers here (Question 1, Question 2, Question 3). Include definitions, formulas, and trade-offs..."
                      className="mt-2 h-36 w-full rounded-lg border border-slate-800 bg-[#090d16] p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={handleEvaluateMockExam}
                        disabled={isLoading || !studentSubmission.trim()}
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{isLoading ? "Grading Against UoN Rubric..." : "Submit for Lecturer Grading"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Evaluation Result */}
                  {evaluationResult && (
                    <div className="rounded-xl border border-emerald-500/40 bg-[#07131a] p-5">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                        Official Lecturer Evaluation & Score Breakdown:
                      </h4>
                      <div className="prose prose-invert max-w-none text-xs text-slate-200">
                        <ReactMarkdown>{evaluationResult}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
