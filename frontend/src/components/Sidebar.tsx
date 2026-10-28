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
  Sparkles,
  BookMarked,
  LogOut,
  LogIn,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

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
  onOpenProfessorMode?: () => void;
  onOpenVault?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  units,
  selectedUnit,
  onSelectUnit,
  onOpenUpload,
  onOpenPastPapers,
  onOpenFlashcards,
  onOpenProfessorMode,
  onOpenVault,
  isOpen = false,
  onClose,
}) => {
  const { user, signOut, openAuthModal } = useAuth();

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Asman Musa";
  const userEmail = user?.email || "asmanmakero@gmail.com";
  const userAvatar = user?.user_metadata?.avatar_url;

  const handleUnitClick = (code: string) => {
    onSelectUnit(code);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col border-r border-slate-800 bg-[#0c111d] text-slate-300 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">EduRAG Scholar</h1>
              <p className="text-[11px] font-medium text-slate-400">UoN Chiromo • CS Year 2</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary Actions */}
        <div className="space-y-1.5 p-3">
          <button
            onClick={() => {
              onOpenUpload();
              if (onClose) onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Course Materials</span>
          </button>
          <button
            onClick={() => {
              onOpenPastPapers();
              if (onClose) onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg border border-slate-700/80 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            <FileCheck2 className="h-4 w-4 text-emerald-400" />
            <span>Past Papers & Exam Suite</span>
          </button>
          <button
            onClick={() => {
              onOpenFlashcards();
              if (onClose) onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-900/40 hover:text-amber-200"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Spaced Repetition (SM-2)</span>
          </button>
          {onOpenVault && (
            <button
              onClick={() => {
                onOpenVault();
                if (onClose) onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg border border-blue-500/30 bg-blue-950/20 px-3 py-2 text-xs font-medium text-blue-300 transition hover:bg-blue-900/40 hover:text-blue-200"
            >
              <BookMarked className="h-4 w-4 text-blue-400" />
              <span>📚 Notes & Exam Vault</span>
            </button>
          )}
          {onOpenProfessorMode && (
            <button
              onClick={() => {
                onOpenProfessorMode();
                if (onClose) onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg border border-indigo-500/30 bg-indigo-950/20 px-3 py-2 text-xs font-medium text-indigo-300 transition hover:bg-indigo-900/40 hover:text-indigo-200"
            >
              <GraduationCap className="h-4 w-4 text-indigo-400" />
              <span>👨‍🏫 Professor Deep Lecture</span>
            </button>
          )}
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
                  onClick={() => handleUnitClick(unit.code)}
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

        {/* Semester Countdown & Account Footer */}
        <div className="border-t border-slate-800/80 p-3.5 space-y-3">
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

          {/* User Account State */}
          {user ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#090d16] p-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userDisplayName}
                    className="h-8 w-8 rounded-full border border-blue-500/40 object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 text-xs font-bold shrink-0">
                    {userDisplayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate max-w-[130px]">{userDisplayName}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#090d16] p-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-300">Guest Scholar</p>
                  <p className="text-[10px] text-slate-500">Sign in to sync your notes</p>
                </div>
              </div>
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1 rounded-lg bg-blue-600/20 border border-blue-500/30 px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition"
              >
                <LogIn className="h-3 w-3" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
