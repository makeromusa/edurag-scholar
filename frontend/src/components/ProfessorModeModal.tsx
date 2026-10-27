"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  GraduationCap,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Send,
  Loader2,
  BookOpen,
  ArrowRight,
  Layers,
  Lightbulb,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface ProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitCode: string;
  initialTopic?: string;
  documentId?: string;
  documentTitle?: string;
}

interface ProfessorChunkData {
  topic_title: string;
  chunk_index: number;
  total_chunks: number;
  chunk_title: string;
  first_principles_essence: string;
  critique_of_previous_answer?: string | null;
  lecture_content: string;
  exam_trap: string;
  socratic_challenge: string;
  next_chunk_preview?: string;
  citations?: Array<{
    page_number: number;
    slide_title: string;
    preview: string;
  }>;
}

const STAGE_LABELS = [
  { step: 1, name: "The Dilemma", short: "1. Dilemma" },
  { step: 2, name: "Core Abstraction", short: "2. Abstraction" },
  { step: 3, name: "Mechanical Trace", short: "3. Trace" },
  { step: 4, name: "Exam Traps", short: "4. Traps" },
  { step: 5, name: "Socratic Mastery", short: "5. Mastery" },
];

export const ProfessorModeModal: React.FC<ProfessorModalProps> = ({
  isOpen,
  onClose,
  unitCode,
  initialTopic = "",
  documentId,
  documentTitle,
}) => {
  const [topic, setTopic] = useState(initialTopic || documentTitle || "");
  const [chunkIndex, setChunkIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [chunkData, setChunkData] = useState<ProfessorChunkData | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial topic when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeTopic = initialTopic || documentTitle || "";
      setTopic(activeTopic);
      setChunkIndex(0);
      setChunkData(null);
      setStudentAnswer("");
      setErrorMsg(null);
      if (activeTopic || documentId) {
        fetchChunk(0, activeTopic, documentId);
      }
    }
  }, [isOpen, initialTopic, documentId, documentTitle]);

  const fetchChunk = async (
    targetIndex: number,
    topicName: string,
    docId?: string,
    previousAnswer?: string,
    explainDeeper: boolean = false
  ) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/professor/teach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_code: unitCode,
          topic: topicName.trim(),
          document_id: docId || undefined,
          chunk_index: targetIndex,
          student_response: previousAnswer || undefined,
          explain_deeper: explainDeeper,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to generate professor lecture chunk.");
      }

      const json = await res.json();
      setChunkData(json.data);
      setChunkIndex(targetIndex);
      setStudentAnswer("");
    } catch (err: any) {
      console.error("Professor Mode error:", err);
      setErrorMsg(err.message || "Failed to load chunk. Please check backend connection.");
    } finally {
      setLoading(false);
      setSubmittingAnswer(false);
    }
  };

  const handleStartLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    fetchChunk(0, topic, documentId);
  };

  const handleNextChunk = (answerToSend?: string) => {
    if (chunkIndex < 4) {
      fetchChunk(chunkIndex + 1, topic, documentId, answerToSend);
    }
  };

  const handlePreviousChunk = () => {
    if (chunkIndex > 0) {
      fetchChunk(chunkIndex - 1, topic, documentId);
    }
  };

  const handleExplainDeeper = () => {
    fetchChunk(chunkIndex, topic, documentId, undefined, true);
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAnswer.trim()) return;
    setSubmittingAnswer(true);
    handleNextChunk(studentAnswer.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col h-[94vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-blue-500/30 bg-[#0b101b] shadow-2xl">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0e1424] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">
                  👨‍🏫 Professor Teaching Mode
                </span>
                <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                  {unitCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Deep First-Principles Abstraction • Step-by-Step Pedagogical Journey
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 5-Step Curriculum Stepper */}
        <div className="border-b border-slate-800 bg-[#090d16] px-3 py-2 sm:px-6">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {STAGE_LABELS.map((stage, idx) => {
              const isCurrent = chunkIndex === idx;
              const isPast = chunkIndex > idx;
              return (
                <button
                  key={stage.step}
                  onClick={() => chunkData && fetchChunk(idx, topic, documentId)}
                  disabled={!chunkData || loading}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[10px] sm:text-xs font-semibold transition ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : isPast
                      ? "bg-emerald-950/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40"
                      : "bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300"
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="shrink-0">{stage.step}.</span>
                  )}
                  <span className="truncate hidden sm:inline">{stage.name}</span>
                  <span className="truncate sm:hidden">{stage.short}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Topic Entry (If not yet chosen) */}
          {!chunkData && !loading && (
            <div className="mx-auto max-w-lg text-center py-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-4 shadow-lg">
                <Layers className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-white">What would you like the Professor to teach?</h3>
              <p className="mt-1 text-xs text-slate-400">
                Choose any difficult concept in {unitCode} (e.g. Memory Paging, Deadlock Banker's Algorithm, Cache Coherence, Matrix Diagonalization). The professor will deconstruct it chunk-by-chunk.
              </p>

              <form onSubmit={handleStartLecture} className="mt-6 flex flex-col gap-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Virtual Memory Paging & TLB translation"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!topic.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-500 disabled:opacity-50 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Begin Socratic Lecture</span>
                </button>
              </form>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-xs font-medium text-slate-300">
                Professor is structuring Chunk {chunkIndex + 1} with first principles & ASCII architecture...
              </p>
              <p className="text-[11px] text-slate-500">Retrieving syllabus notes from Chiromo course library</p>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Active Lecture Chunk */}
          {chunkData && !loading && (
            <div className="space-y-5 animate-in fade-in duration-300">
              
              {/* Chunk Header */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/20">
                      Chunk {chunkIndex + 1} of 5
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {chunkData.topic_title}
                    </span>
                  </div>
                  {documentTitle && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {documentTitle}
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-xl font-extrabold text-white tracking-tight">
                  {chunkData.chunk_title}
                </h2>
              </div>

              {/* Professor Critique of Previous Answer (If Student Submitted) */}
              {chunkData.critique_of_previous_answer && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 shadow-md">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Professor's Evaluation of Your Solution:</span>
                  </div>
                  <p className="mt-2 text-xs text-emerald-200/90 leading-relaxed">
                    {chunkData.critique_of_previous_answer}
                  </p>
                </div>
              )}

              {/* 💡 First Principles Essence Box */}
              <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <span>The First-Principles Essence</span>
                </div>
                <p className="mt-1.5 text-xs font-medium text-slate-200 leading-relaxed italic">
                  "{chunkData.first_principles_essence}"
                </p>
              </div>

              {/* 📖 Deep Lecture Content */}
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3">
                <ReactMarkdown
                  components={{
                    pre: ({ node, ...props }) => (
                      <pre
                        {...props}
                        className="rounded-xl border border-slate-700 bg-black/70 p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto shadow-inner"
                      />
                    ),
                    code: ({ node, ...props }) => (
                      <code
                        {...props}
                        className="rounded bg-slate-800 px-1.5 py-0.5 text-blue-300 font-mono text-xs"
                      />
                    ),
                  }}
                >
                  {chunkData.lecture_content}
                </ReactMarkdown>
              </div>

              {/* ⚠️ Lecturer Exam Traps Callout */}
              {chunkData.exam_trap && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Chiromo Lecturer Exam Trap Alert:</span>
                  </div>
                  <p className="mt-1.5 text-xs text-amber-200/90 leading-relaxed">
                    {chunkData.exam_trap}
                  </p>
                </div>
              )}

              {/* 🎯 Socratic Checkpoint & Active Recall Drill */}
              {chunkData.socratic_challenge && (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 sm:p-5 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    <HelpCircle className="h-4 w-4 text-indigo-400" />
                    <span>Socratic Checkpoint • Active Recall Challenge</span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm font-semibold text-white leading-relaxed">
                    {chunkData.socratic_challenge}
                  </p>

                  <form onSubmit={handleAnswerSubmit} className="mt-3 space-y-2">
                    <textarea
                      rows={3}
                      value={studentAnswer}
                      onChange={(e) => setStudentAnswer(e.target.value)}
                      placeholder="Type your reasoning or answer here for Professor evaluation before advancing..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleExplainDeeper}
                        disabled={loading}
                        className="text-[11px] text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Explain deeper with analogy</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {chunkIndex < 4 && (
                          <button
                            type="button"
                            onClick={() => handleNextChunk()}
                            disabled={loading}
                            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                          >
                            Skip & Advance →
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={!studentAnswer.trim() || submittingAnswer || loading}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition"
                        >
                          {submittingAnswer ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>Submit & Advance</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Citations from Notes */}
              {chunkData.citations && chunkData.citations.length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Grounded in Course Notes:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chunkData.citations.map((cit, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-slate-800 bg-slate-900/60 px-2 py-1 text-[10px] text-slate-400"
                      >
                        Slide {cit.page_number}: {cit.slide_title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        {chunkData && (
          <div className="border-t border-slate-800 bg-[#0e1424] px-4 py-3 sm:px-6 flex items-center justify-between">
            <button
              onClick={handlePreviousChunk}
              disabled={chunkIndex === 0 || loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous Chunk</span>
            </button>

            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Progress: {chunkIndex + 1} / 5 Chunks Complete
            </span>

            {chunkIndex < 4 ? (
              <button
                onClick={() => handleNextChunk()}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-blue-500 disabled:opacity-40 transition"
              >
                <span>Next Chunk: {STAGE_LABELS[chunkIndex + 1]?.name}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Lecture Completed</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
