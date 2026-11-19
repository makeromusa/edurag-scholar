"use client";

import React, { useState } from "react";
import { Sunrise, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

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

  const handleTriggerNow = async () => {
    setIsTriggering(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      await fetch(`${apiUrl}/api/briefings/trigger-now`, { method: "POST" });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriggering(false);
    }
  };

  const defaultContent = `### 🌅 EduRAG Morning Briefing
- **Today's Mission:** Focus on Memory Hierarchy & Virtual Memory paging.
- **5-Min Weakness Drill:** What is the difference between internal and external fragmentation?
- **Pro-tip:** Review the 4 necessary conditions for deadlock in university examination questions.`;

  // ── Compact pill mode: used inside the Header bar ──────────────────────────
  if (compact) {
    return (
      <div className="relative hidden lg:block">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
        >
          <Sunrise className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span>Daily Mission</span>
          <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {isExpanded ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
        </button>

        {isExpanded && (
          <div className="absolute left-0 top-full mt-2 w-80 z-50 rounded-xl border border-slate-700 bg-[#0f172a] shadow-2xl shadow-black/40 p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sunrise className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Daily Academic Mission</span>
              </div>
              <button
                onClick={handleTriggerNow}
                disabled={isTriggering}
                className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${isTriggering ? "animate-spin text-blue-400" : ""}`} />
                {isTriggering ? "Syncing..." : "Refresh"}
              </button>
            </div>
            <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed">
              <ReactMarkdown>{briefingMarkdown || defaultContent}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Full card mode (mobile / fallback) ─────────────────────────────────────
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 shadow-sm backdrop-blur-sm transition-all">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 sm:px-4"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 shrink-0">
            <Sunrise className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold tracking-wide text-blue-400 uppercase whitespace-nowrap">
              Daily Mission
            </span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[11px] text-slate-500 truncate hidden sm:block">
              Synced with lecture timetable & weakness logs
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-500">{isExpanded ? "Hide" : "View"}</span>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-800/80 px-3 pb-3 pt-3 sm:px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Today's Briefing</span>
            <button
              onClick={handleTriggerNow}
              disabled={isTriggering}
              className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${isTriggering ? "animate-spin text-blue-400" : ""}`} />
              {isTriggering ? "Syncing..." : "Refresh"}
            </button>
          </div>
          <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed">
            <ReactMarkdown>{briefingMarkdown || defaultContent}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
