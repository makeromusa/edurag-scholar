"use client";

import React, { useState } from "react";
import { Sunrise, Clock, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DailyMissionProps {
  briefingMarkdown?: string;
  onRefresh?: () => void;
}

export const DailyMissionCard: React.FC<DailyMissionProps> = ({
  briefingMarkdown,
  onRefresh,
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

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-3 sm:p-4 shadow-sm backdrop-blur-sm transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 shrink-0">
            <Sunrise className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-semibold tracking-wide text-blue-400 uppercase">
                Daily Academic Mission
              </h2>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10px] font-medium text-emerald-400">
                Live EAT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden sm:block">
              Synced with weekly lecture timetable & weakness logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleTriggerNow}
            disabled={isTriggering}
            className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/70 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
            title="Force run the morning abstractor"
          >
            <RefreshCw className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isTriggering ? "animate-spin text-blue-400" : ""}`} />
            <span className="hidden sm:inline">{isTriggering ? "Synthesizing..." : "Refresh"}</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg border border-slate-700/80 bg-slate-800/60 p-1 sm:p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition flex items-center gap-1 text-[11px]"
          >
            <span className="sm:hidden text-xs text-slate-300 font-medium">{isExpanded ? "Hide" : "View"}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 prose prose-invert max-w-none text-xs text-slate-300 animate-fadeIn">
          <ReactMarkdown>{briefingMarkdown || defaultContent}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};
