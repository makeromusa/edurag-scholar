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

  const defaultContent = `### 🌅 Chiromo 3 AM Morning Briefing
- **Today's Mission:** Focus on Memory Hierarchy & Virtual Memory paging.
- **5-Min Weakness Drill:** What is the difference between internal and external fragmentation?
- **Pro-tip:** Dr. Miriti emphasizes the 4 necessary conditions for deadlock in exam questions.`;

  return (
    <div className="mb-4 sm:mb-6 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-slate-900 to-indigo-950/20 p-4 sm:p-5 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 shrink-0">
            <Sunrise className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-semibold tracking-wide text-blue-400 uppercase">
                3 AM Abstractor • Morning Mission
              </h2>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-emerald-400">
                Live EAT
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-none">
              Synced with Chiromo LG01 lecture timetable & weakness logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleTriggerNow}
            disabled={isTriggering}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
            title="Force run the 3 AM abstractor"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTriggering ? "animate-spin text-blue-400" : ""}`} />
            {isTriggering ? "Synthesizing..." : "Run Abstractor"}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className={`mt-4 prose prose-invert max-w-none text-xs text-slate-300 ${isExpanded ? "" : "max-h-24 overflow-hidden"}`}>
        <ReactMarkdown>{briefingMarkdown || defaultContent}</ReactMarkdown>
      </div>
      
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300"
        >
          Expand full briefing →
        </button>
      )}
    </div>
  );
};
