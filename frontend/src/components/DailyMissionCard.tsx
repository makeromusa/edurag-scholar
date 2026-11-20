"use client";

import React, { useState } from "react";
import {
  Sunrise,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  BrainCircuit,
  Eye,
  EyeOff,
  BookOpen,
} from "lucide-react";
import { AcademicMarkdown } from "./AcademicMarkdown";

interface DailyMissionProps {
  briefingMarkdown?: string;
  onRefresh?: () => void;
  /** When true, renders as a slim inline pill for embedding inside the header bar */
  compact?: boolean;
}

export const DailyMissionCard: React.FC<DailyMissionProps> = ({
  briefingMarkdown,
  onRefresh,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleTriggerNow = async () => {
    setIsTriggering(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      await fetch(`${apiUrl}/api/briefings/trigger-now`, { method: "POST" });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriggering(false);
    }
  };

  const defaultContent = `### 🌅 EduRAG Morning Briefing & Academic Abstractor
- **Today's Mission:** Review Fundamental Integration Rules & Differential Equations.
- **5-Min Weakness Drill:** How do you solve $\\int x e^{2x} dx$ using integration by parts?
- **Examiner's Trap:** Always remember the constant of integration $+ C$ in indefinite integrals, and verify whether the chain rule applies to the exponent.`;

  // ── Compact pill mode: used inside the Header bar ──────────────────────────
  if (compact) {
    return (
      <div className="relative hidden lg:block">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-950/30 px-3 py-1.5 text-[11px] font-semibold text-blue-300 hover:bg-blue-900/40 hover:text-white transition shadow-sm"
        >
          <Sunrise className="h-3.5 w-3.5 text-blue-400 shrink-0 animate-pulse" />
          <span>Daily Mission</span>
          <span className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/80" />
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-slate-400 ml-0.5" />
          ) : (
            <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
          )}
        </button>

        {isExpanded && (
          <div className="absolute left-0 top-full mt-2 w-96 z-50 rounded-2xl border border-slate-700/80 bg-[#0c121e] shadow-2xl shadow-black/80 p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Sunrise className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wide">
                  Autonomous Abstractor Dossier
                </span>
              </div>
              <button
                onClick={handleTriggerNow}
                disabled={isTriggering}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-2.5 w-2.5 ${isTriggering ? "animate-spin text-blue-400" : ""}`}
                />
                <span>{isTriggering ? "Synthesizing..." : "Sync"}</span>
              </button>
            </div>
            <div className="max-h-[380px] overflow-y-auto pr-1">
              <AcademicMarkdown content={briefingMarkdown || defaultContent} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Full card mode (Mobile & Desktop Workstation Banner) ────────────────────
  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-[#0e1628] to-[#090d16] shadow-md backdrop-blur-md transition-all overflow-hidden">
      {/* Top Banner Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-slate-800/80">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 min-w-0 text-left flex-1"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm shadow-blue-500/30 shrink-0">
            <Sunrise className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                <span>Daily Study Dossier</span>
                <span className="text-[10px] font-bold text-sky-400 bg-sky-950/70 border border-sky-800/40 px-1.5 py-0.2 rounded-full">
                  Abstractor
                </span>
              </span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Synced with your timetable, past papers & lecture weaknesses
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTriggerNow}
            disabled={isTriggering}
            className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition disabled:opacity-50"
            title="Re-run 3 AM Abstractor to refresh today's revision dossier"
          >
            <RefreshCw
              className={`h-3 w-3 ${isTriggering ? "animate-spin text-blue-400" : "text-slate-400"}`}
            />
            <span className="hidden sm:inline">
              {isTriggering ? "Synthesizing..." : "Sync Notes"}
            </span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label={isExpanded ? "Collapse briefing" : "Expand briefing"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Multi-Section Structured Abstractor View */}
      {isExpanded && (
        <div className="p-3.5 sm:p-5 space-y-4 animate-in fade-in duration-200">
          {/* Quick Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Pillar 1: High Yield Mission */}
            <div className="rounded-xl border border-sky-500/25 bg-sky-950/15 p-3 relative overflow-hidden">
              <div className="flex items-center gap-2 text-sky-400 mb-1.5">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Core Objective
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                Focus on high-probability examination principles and syllabus definitions.
              </p>
            </div>

            {/* Pillar 2: 5-Minute Recall */}
            <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-3 relative overflow-hidden">
              <div className="flex items-center gap-2 text-amber-300 mb-1.5">
                <BrainCircuit className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Active Recall Drill
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                Solve step-by-step calculus proofs & mechanical traces before class.
              </p>
            </div>

            {/* Pillar 3: Examiner Gotcha */}
            <div className="rounded-xl border border-rose-500/25 bg-rose-950/15 p-3 relative overflow-hidden">
              <div className="flex items-center gap-2 text-rose-400 mb-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Examiner Trap Alert
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                Avoid common marking-scheme deductions and skipped algebraic steps.
              </p>
            </div>
          </div>

          {/* Rendered Academic Markdown Dossier */}
          <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 sm:p-5 shadow-inner">
            <AcademicMarkdown content={briefingMarkdown || defaultContent} />
          </div>
        </div>
      )}
    </div>
  );
};
