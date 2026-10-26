"use client";

import React from "react";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  UploadCloud,
  FileCheck2,
  Clock,
  Layers,
  Sparkles
} from "lucide-react";

export interface Unit {
  code: string;
  name: string;
  lecturer: string;
  venue: string;
}

interface SidebarProps {
  units: Unit[];
  selectedUnit: string;
  onSelectUnit: (unitCode: string) => void;
  onOpenUpload: () => void;
  onOpenPastPapers: () => void;
  onOpenFlashcards: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  units,
  selectedUnit,
  onSelectUnit,
  onOpenUpload,
  onOpenPastPapers,
  onOpenFlashcards,
}) => {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-800 bg-[#0c111d] text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white">EduRAG Scholar</h1>
          <p className="text-[11px] font-medium text-slate-400">UoN Chiromo • CS Year 2</p>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="space-y-1.5 p-3">
        <button
          onClick={onOpenUpload}
          className="flex w-full items-center gap-2.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload Course Materials</span>
        </button>
        <button
          onClick={onOpenPastPapers}
          className="flex w-full items-center gap-2.5 rounded-lg border border-slate-700/80 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
        >
          <FileCheck2 className="h-4 w-4 text-emerald-400" />
          <span>Past Papers & Exam Suite</span>
        </button>
        <button
          onClick={onOpenFlashcards}
          className="flex w-full items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-900/40 hover:text-amber-200"
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Spaced Repetition (SM-2)</span>
        </button>
      </div>

      {/* The 7 Units Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            The 7 Course Units
          </span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
            {units.length} Units
          </span>
        </div>

        <nav className="space-y-1">
          {units.map((unit) => {
            const isSelected = selectedUnit === unit.code;
            return (
              <button
                key={unit.code}
                onClick={() => onSelectUnit(unit.code)}
                className={`flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition ${
                  isSelected
                    ? "border border-blue-500/40 bg-blue-600/15 text-white shadow-inner"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? "text-blue-400" : "text-slate-300"}`}>
                    {unit.code}
                  </span>
                  <span className="text-[10px] text-slate-500">{unit.venue}</span>
                </div>
                <span className="line-clamp-1 text-[11px] text-slate-400">{unit.name}</span>
                <span className="text-[10px] text-slate-500">{unit.lecturer}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Semester Countdown Footer */}
      <div className="border-t border-slate-800/80 p-3.5">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[11px] font-medium">Final Exams Countdown</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-200">Dec 7 – 18, 2026</p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Venue: LG01 Chiromo
          </div>
        </div>

        {/* User Info */}
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-200">
              AM
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-white">Asman Musa</p>
              <p className="text-[10px] text-slate-400">Lead Scholar (Admin)</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
