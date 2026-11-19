"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  FileText,
  UploadCloud,
  FileCheck2,
  Sparkles,
  BookMarked,
  LogOut,
  LogIn,
  User as UserIcon,
  X,
  Shield,
  Compass,
  ChevronDown,
  Check,
  Plus,
  Key,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { RequestUnitModal } from "./RequestUnitModal";
import { DeveloperApiModal } from "./DeveloperApiModal";

export interface Unit {
  code: string;
  name: string;
  lecturer: string;
  venue: string;
  status?: string;
  is_system_unit?: boolean;
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
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isRequestUnitOpen, setIsRequestUnitOpen] = useState(false);
  const [isDeveloperApiOpen, setIsDeveloperApiOpen] = useState(false);

  const userDisplayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Scholar";
  const userEmail = user?.email || "";
  const userAvatar = user?.user_metadata?.avatar_url;

  const enrolledUnitCodes = (profile?.enrolled_units || []).map((c: string) => c.toUpperCase());
  
  // Categorize enrolled vs available units
  const myEnrolledUnits = enrolledUnitCodes.map((code: string) => {
    const existing = units.find((u) => u.code.toUpperCase() === code);
    return existing || { code, name: "Enrolled Course", lecturer: "Faculty Lecturer", venue: "Campus" };
  });

  const displayUnits = myEnrolledUnits.length > 0 ? myEnrolledUnits : units;

  const activeUnitObj = units.find(
    (u) => u.code.toUpperCase() === selectedUnit.toUpperCase()
  ) || displayUnits[0] || {
    code: selectedUnit || "SCS 3201",
    name: "Academic Unit",
    lecturer: "Chief Examiner",
    venue: "Campus",
  };

  const handleUnitSelect = (code: string) => {
    onSelectUnit(code);
    setIsUnitDropdownOpen(false);
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
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/20">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>EduRAG</span>
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/60 border border-blue-800/40 px-1.5 py-0.2 rounded">
                  Scholar
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">Academic RAG & Copilot</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Compact Course Unit Selector (Zero vertical scrolling clutter) */}
        <div className="px-3 py-2.5 border-b border-slate-800/80 bg-[#090d16]/70 shrink-0 relative z-30">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Course Unit
            </span>
            <button
              onClick={() => setIsRequestUnitOpen(true)}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5 transition"
              title="Request or add a custom course unit"
            >
              <Plus className="h-3 w-3" />
              <span>Add Unit</span>
            </button>
          </div>

          {/* Unit Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-blue-500/30 bg-blue-950/20 px-3 py-2 text-left hover:border-blue-500/50 hover:bg-blue-950/30 transition shadow-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate">{activeUnitObj.code}</span>
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-medium text-blue-300 shrink-0">
                    {activeUnitObj.venue || "Campus"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">{activeUnitObj.name}</p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
                  isUnitDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUnitDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 max-h-72 overflow-y-auto rounded-xl border border-slate-700/80 bg-[#0d1322] p-1.5 shadow-2xl backdrop-blur-md">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Active Unit
                </div>
                <div className="space-y-1">
                  {displayUnits.map((u) => {
                    const isSelected = u.code.toUpperCase() === selectedUnit.toUpperCase();
                    return (
                      <button
                        key={u.code}
                        onClick={() => handleUnitSelect(u.code)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                          isSelected
                            ? "bg-blue-600/20 border border-blue-500/40 text-blue-300 font-semibold"
                            : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                        }`}
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-bold">{u.code}</span> -{" "}
                          <span className="text-slate-400 text-[11px]">{u.name}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-1.5 pt-1.5 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsUnitDropdownOpen(false);
                      setIsRequestUnitOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700 bg-slate-900/60 py-1.5 text-xs font-semibold text-blue-400 hover:border-blue-500 hover:bg-blue-950/20 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Request New Unit (Admin Review)...</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Academic Workspaces Navigation (Full vertical visibility, no crowding) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Academic Workspaces
          </div>

          <nav className="space-y-1">
            {onOpenAssignmentStudio && (
              <button
                onClick={() => {
                  onOpenAssignmentStudio();
                  if (onClose) onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600/25 to-indigo-600/25 hover:from-blue-600/35 hover:to-indigo-600/35 border border-blue-500/35 transition group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Assignment Studio</span>
                </div>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-bold text-blue-300 uppercase tracking-wider border border-blue-500/30">
                  #1 Core
                </span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenUpload();
                if (onClose) onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
            >
              <UploadCloud className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
              <span>Upload Slide Deck / Notes</span>
            </button>

            {onOpenExamSimulator && (
              <button
                onClick={() => {
                  onOpenExamSimulator();
                  if (onClose) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
              >
                <FileCheck2 className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
                <span>Simulated Examination</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenPastPapers();
                if (onClose) onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
            >
              <FileText className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
              <span>Past Exam Questions</span>
            </button>

            {onOpenRevisionQA && (
              <button
                onClick={() => {
                  onOpenRevisionQA();
                  if (onClose) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
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
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-slate-400 group-hover:text-amber-400 transition" />
              <span>Spaced Repetition (SM-2)</span>
            </button>

            {onOpenVault && (
              <button
                onClick={() => {
                  onOpenVault();
                  if (onClose) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
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
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
              >
                <GraduationCap className="h-4 w-4 text-slate-400 group-hover:text-purple-400 transition" />
                <span>Oral Masterclass Studio</span>
              </button>
            )}

            {onOpenPipelines && (
              <button
                onClick={() => {
                  onOpenPipelines();
                  if (onClose) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer"
              >
                <Layers className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 transition" />
                <span>Autonomous Pipelines</span>
              </button>
            )}
          </nav>
        </div>

        {/* Account & Administration Footer */}
        <div className="border-t border-slate-800/80 p-3 space-y-2 shrink-0 bg-[#090d16]/90">
          {/* Developer API Keys Shortcut */}
          <button
            onClick={() => setIsDeveloperApiOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-purple-500/25 bg-purple-950/20 px-3 py-1.5 text-xs font-semibold text-purple-300 transition hover:bg-purple-950/40"
            title="Generate API key and access developer REST endpoints"
          >
            <div className="flex items-center gap-2">
              <Key className="h-3.5 w-3.5 text-purple-400" />
              <span>Developer API Keys</span>
            </div>
            <span className="text-[9px] uppercase font-mono bg-purple-900/50 px-1.5 py-0.2 rounded text-purple-200 border border-purple-500/30">
              REST v1
            </span>
          </button>

          {/* Super Admin Command Shortcut */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => {
                if (onClose) onClose();
              }}
              className="flex w-full items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-amber-400" />
                <span>Admin Command</span>
              </div>
              <span className="text-[9px] uppercase font-mono bg-slate-900/80 px-1.5 py-0.2 rounded text-amber-300 border border-amber-500/30">
                Portal
              </span>
            </Link>
          )}

          {/* User Account State */}
          {user ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0c121e] p-2">
              <div className="flex items-center gap-2 min-w-0">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userDisplayName}
                    className="h-7 w-7 rounded-full border border-blue-500/40 object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 text-xs font-bold shrink-0">
                    {userDisplayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate max-w-[130px]">
                    {userDisplayName}
                  </p>
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
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0c121e] p-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-300">Guest Scholar</p>
                  <p className="text-[10px] text-slate-500">Sign in to sync notes</p>
                </div>
              </div>
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1 rounded-lg bg-blue-600/20 border border-blue-500/30 px-2 py-1 text-[11px] font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition"
              >
                <LogIn className="h-3 w-3" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Modals */}
      <RequestUnitModal
        isOpen={isRequestUnitOpen}
        onClose={() => setIsRequestUnitOpen(false)}
      />
      <DeveloperApiModal
        isOpen={isDeveloperApiOpen}
        onClose={() => setIsDeveloperApiOpen(false)}
      />
    </>
  );
};
