"use client";

import React from "react";
import Link from "next/link";
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
  Shield,
  Compass,
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
  onOpenExamSimulator?: () => void;
  onOpenRevisionQA?: () => void;
  onOpenPipelines?: () => void;
  onOpenAssignmentStudio?: () => void;
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
  onOpenExamSimulator,
  onOpenRevisionQA,
  onOpenPipelines,
  onOpenAssignmentStudio,
  isOpen = false,
  onClose,
}) => {
  const { user, signOut, openAuthModal, isAdmin, profile } = useAuth();

  const userDisplayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Scholar";
  const userEmail = user?.email || "";
  const userAvatar = user?.user_metadata?.avatar_url;

  const enrolledUnitCodes = (profile?.enrolled_units || []).map((c: string) => c.toUpperCase());
  const myEnrolledUnits = enrolledUnitCodes.map((code: string) => {
    const existing = units.find((u) => u.code.toUpperCase() === code);
    return existing || { code, name: "Enrolled Course", lecturer: "Faculty Lecturer", venue: "Campus" };
  });
  const otherUnits = units.filter((u) => !enrolledUnitCodes.includes(u.code.toUpperCase()));

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
              <p className="text-[11px] font-medium text-slate-400">Academic AI Copilot</p>
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

        {/* Primary Actions & Study Tools */}
        <div className="space-y-1 p-3 border-b border-slate-800/80">
          <button
            onClick={() => {
              onOpenUpload();
              if (onClose) onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-xs transition mb-2 cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Course Materials</span>
          </button>

          <nav className="space-y-0.5">
            {onOpenAssignmentStudio && (
              <button
                onClick={() => {
                  onOpenAssignmentStudio();
                  if (onClose) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-200 hover:text-white bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 transition group cursor-pointer shadow-sm mb-1"
              >
                <Compass className="h-4 w-4 text-blue-400 group-hover:rotate-45 transition-transform" />
                <span>Assignment Studio</span>
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono tracking-wider uppercase font-bold border border-blue-400/20">PRO</span>
              </button>
            )}
            {onOpenPipelines && (
              <button
                onClick={() => {
                  onOpenPipelines();
                  if (onClose) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
              >
                <Layers className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
                <span>Exam PDF Pipelines</span>
              </button>
            )}
            {onOpenExamSimulator && (
              <button
                onClick={() => {
                  onOpenExamSimulator();
                  if (onClose) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
              >
                <FileCheck2 className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
                <span>Exam Simulator & Papers</span>
              </button>
            )}
            {onOpenRevisionQA && (
              <button
                onClick={() => {
                  onOpenRevisionQA();
                  if (onClose) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
                <span>Q&A Compendium</span>
              </button>
            )}
            <button
              onClick={() => {
                onOpenFlashcards();
                if (onClose) onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
              <span>Spaced Repetition (SM-2)</span>
            </button>
            {onOpenVault && (
              <button
                onClick={() => {
                  onOpenVault();
                  if (onClose) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
              >
                <BookMarked className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
                <span>Notes & Exam Vault</span>
              </button>
            )}
            {onOpenProfessorMode && (
              <button
                onClick={() => {
                  onOpenProfessorMode();
                  if (onClose) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
              >
                <GraduationCap className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
                <span>Oral Masterclass Studio</span>
              </button>
            )}
          </nav>
        </div>

        {/* Units Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {myEnrolledUnits.length > 0 ? (
            <div>
              <div className="mb-2 flex items-center justify-between px-2">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  My Enrolled Courses
                </span>
                <span className="rounded bg-slate-800 border border-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                  {myEnrolledUnits.length}
                </span>
              </div>

              <nav className="space-y-1">
                {myEnrolledUnits.map((unit) => {
                  const isSelected = selectedUnit.toUpperCase() === unit.code.toUpperCase();
                  return (
                    <button
                      key={unit.code}
                      onClick={() => handleUnitClick(unit.code)}
                      className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition cursor-pointer ${
                        isSelected
                          ? "border border-blue-500/40 bg-blue-600/15 text-white"
                          : "border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className={`text-xs font-semibold ${isSelected ? "text-blue-400" : "text-slate-300"}`}>
                          {unit.code}
                        </span>
                        <span className="text-[10px] text-slate-500">{unit.venue || "Campus"}</span>
                      </div>
                      <span className="line-clamp-1 text-[11px] text-slate-400">{unit.name}</span>
                      <span className="text-[10px] text-slate-500">{unit.lecturer}</span>
                    </button>
                  );
                })}
              </nav>

              {otherUnits.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                      Other Department Units
                    </span>
                    <span className="text-[10px] text-slate-600">{otherUnits.length}</span>
                  </div>
                  <nav className="space-y-1">
                    {otherUnits.map((unit) => {
                      const isSelected = selectedUnit.toUpperCase() === unit.code.toUpperCase();
                      return (
                        <button
                          key={unit.code}
                          onClick={() => handleUnitClick(unit.code)}
                          className={`flex w-full flex-col items-start rounded-lg px-3 py-1.5 text-left transition ${
                            isSelected
                              ? "border border-blue-500/40 bg-blue-600/15 text-white"
                              : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                          }`}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400">{unit.code}</span>
                          </div>
                          <span className="line-clamp-1 text-[10px] text-slate-500">{unit.name}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <div>
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
                  const isSelected = selectedUnit.toUpperCase() === unit.code.toUpperCase();
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
          )}
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
              Venue: Main Lecture Hall
            </div>
          </div>

          {/* Super Admin Command Shortcut */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => {
                if (onClose) onClose();
              }}
              className="flex w-full items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 mb-2"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <span>Admin Command</span>
              </div>
              <span className="text-[10px] uppercase font-mono bg-slate-900/80 px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/30">
                Portal
              </span>
            </Link>
          )}

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
