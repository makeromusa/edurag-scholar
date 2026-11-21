"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  MessageSquare,
  Headphones,
  FileCheck2,
  Sparkles,
  Shield,
  ArrowRight,
  CheckCircle2,
  UploadCloud,
  FileText,
  Compass,
  Clock,
  Layers,
  ChevronDown,
  User as UserIcon,
  LogOut,
  LogIn,
  Plus,
  Check,
  Search,
  BookMarked,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  FolderOpen,
} from "lucide-react";
import { Unit } from "@/components/Sidebar";
import { ChatView } from "@/components/ChatView";
import { DocumentViewer, ActiveCitation } from "@/components/DocumentViewer";
import { DailyMissionCard } from "@/components/DailyMissionCard";
import { UploadModal } from "@/components/UploadModal";
import { PastPaperModal } from "@/components/PastPaperModal";
import { FlashcardModal } from "@/components/FlashcardModal";
import { AuthModal } from "@/components/AuthModal";
import { ProfessorLectureStudio } from "@/components/ProfessorLectureStudio";
import { AcademicVaultModal } from "@/components/AcademicVaultModal";
import { ExamSimulatorModal } from "@/components/ExamSimulatorModal";
import { RevisionQAModal } from "@/components/RevisionQAModal";
import { DocumentPipelinesModal } from "@/components/DocumentPipelinesModal";
import { AssignmentStudioModal } from "@/components/AssignmentStudioModal";
import { RequestUnitModal } from "@/components/RequestUnitModal";
import { Footer } from "@/components/Footer";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useAuth } from "@/lib/AuthContext";

const DEFAULT_UNITS: Unit[] = [
  { code: "SMA 2114", name: "Differential and Integral Calculus", lecturer: "Dr. Okeyo", venue: "LG01" },
  { code: "SCS 3201", name: "Systems Analysis and Design", lecturer: "Mr. Shonyela Ochukut", venue: "LG01" },
  { code: "SCS 3203", name: "Computer Architecture", lecturer: "Dr. Yohanna", venue: "LG01" },
  { code: "SCS 3205", name: "Knowledge-Based Systems & Programming", lecturer: "Dr. Mutemi", venue: "LG01" },
  { code: "SCS 3207", name: "Operating Systems", lecturer: "Dr. Miriti", venue: "LG01" },
  { code: "SCS 3209", name: "Software Engineering", lecturer: "Mr. Gordon", venue: "LG01" },
  { code: "CSC 3211", name: "Computer Networks", lecturer: "Ms. Ronge", venue: "LG01" },
];

export default function Home() {
  const [units, setUnits] = useState<Unit[]>(DEFAULT_UNITS);
  const [selectedUnit, setSelectedUnit] = useState<string>("SCS 3207");
  const [activeCitation, setActiveCitation] = useState<ActiveCitation | null>(null);
  
  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPastPapersOpen, setIsPastPapersOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [isProfessorOpen, setIsProfessorOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isExamSimulatorOpen, setIsExamSimulatorOpen] = useState(false);
  const [isRevisionQAOpen, setIsRevisionQAOpen] = useState(false);
  const [isPipelinesOpen, setIsPipelinesOpen] = useState(false);
  const [isAssignmentStudioOpen, setIsAssignmentStudioOpen] = useState(false);
  const [isRequestUnitOpen, setIsRequestUnitOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Professor lecture params
  const [professorTopic, setProfessorTopic] = useState<string | undefined>(undefined);
  const [professorDocId, setProfessorDocId] = useState<string | undefined>(undefined);
  const [professorDocTitle, setProfessorDocTitle] = useState<string | undefined>(undefined);

  const [briefingMarkdown, setBriefingMarkdown] = useState<string | undefined>(undefined);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [mobileWorkstationTab, setMobileWorkstationTab] = useState<"chat" | "documents">("chat");

  const { user, profile, session, isLoading, openAuthModal, signOut, isAdmin } = useAuth();

  const isSuperAdmin = (user?.email || "").toLowerCase() === "makeromusa17@gmail.com";
  const hasAdminAccess = isAdmin || isSuperAdmin;
  const userDisplayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Scholar";
  const userEmail = user?.email || "";

  useEffect(() => {
    // Fetch units and today's briefing from backend (authenticated so custom units are included)
    const fetchData = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const [unitsRes, briefingRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/units`, { headers }),
          fetch(`${apiUrl}/api/briefings/today`, { headers }),
        ]);

        if (unitsRes.status === "fulfilled" && unitsRes.value.ok) {
          const uData = await unitsRes.value.json();
          if (uData.units && uData.units.length > 0) setUnits(uData.units);
        }

        if (briefingRes.status === "fulfilled" && briefingRes.value.ok) {
          const bData = await briefingRes.value.json();
          if (bData.briefing && bData.briefing.markdown_content) {
            setBriefingMarkdown(bData.briefing.markdown_content);
          }
        }
      } catch (e) {
        console.error("Backend offline, using seeded defaults", e);
      }
    };

    fetchData();
  }, [user?.id, session?.access_token]);

  // Merge enrolled custom units with system units so nothing is hidden
  const enrolledUnitCodes = (profile?.enrolled_units || []).map((c: string) => c.toUpperCase());
  const unitMap = new Map<string, Unit>();
  units.forEach((u) => {
    unitMap.set(u.code.toUpperCase(), u);
  });
  enrolledUnitCodes.forEach((code: string) => {
    if (!unitMap.has(code)) {
      unitMap.set(code, {
        code,
        name: "Custom Enrolled Course",
        lecturer: "Faculty Lecturer",
        venue: "Main Campus",
      });
    }
  });
  const allAvailableUnits = Array.from(unitMap.values());

  const currentUnit =
    allAvailableUnits.find((u) => u.code.toUpperCase() === (selectedUnit || "").toUpperCase()) ||
    allAvailableUnits[0] || {
      code: selectedUnit || "SCS 3201",
      name: "Academic Unit",
      lecturer: "Chief Examiner",
      venue: "Campus",
    };

  const handleOpenProfessor = (topic?: string, docId?: string, docTitle?: string) => {
    setProfessorTopic(topic);
    setProfessorDocId(docId);
    setProfessorDocTitle(docTitle);
    setIsProfessorOpen(true);
  };

  const handleCitationSelect = (citation: ActiveCitation) => {
    setActiveCitation(citation);
    setMobileWorkstationTab("documents");
  };

  return (
    <div className="min-h-screen w-full bg-[#070b14] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-blue-600/30 selection:text-blue-200">
      {/* ── 1. Top Academic Navigation Bar (Sticky, Clean, Accessible) ── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d19]/95 px-4 sm:px-8 py-3 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black shadow-md shadow-blue-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <Link href="/" className="flex items-center gap-1.5 group">
                <span className="text-base font-extrabold tracking-tight text-white group-hover:text-blue-400 transition">
                  EduRAG
                </span>
                <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/40 px-1.5 py-0.5 rounded">
                  Scholar
                </span>
              </Link>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                University Learning Assistant & Knowledge Engine
              </p>
            </div>
          </div>

          {/* Center: Course Unit Selector Dropdown */}
          <div className="relative min-w-0 max-w-xs sm:max-w-sm flex-1">
            <button
              onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-blue-500/30 bg-blue-950/20 px-3 py-2 text-left hover:border-blue-500/50 hover:bg-blue-950/30 transition shadow-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate">{currentUnit.code}</span>
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-medium text-blue-300 shrink-0">
                    {currentUnit.venue || "Campus"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">{currentUnit.name}</p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
                  isUnitDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUnitDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto rounded-2xl border border-slate-700 bg-[#0d1322] p-2 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Active Course Unit
                </div>
                <div className="space-y-1 mt-1">
                  {allAvailableUnits.map((u) => {
                    const isSelected = u.code.toUpperCase() === selectedUnit.toUpperCase();
                    return (
                      <button
                        key={u.code}
                        onClick={() => {
                          setSelectedUnit(u.code);
                          setIsUnitDropdownOpen(false);
                          setActiveCitation(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                          isSelected
                            ? "bg-blue-600/25 border border-blue-500/40 text-blue-300 font-bold"
                            : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                        }`}
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-bold text-white">{u.code}</span> —{" "}
                          <span className="text-slate-400 text-[11px]">{u.name}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-blue-400 shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsUnitDropdownOpen(false);
                      setIsRequestUnitOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 py-2 text-xs font-semibold text-blue-400 hover:border-blue-500 hover:bg-blue-950/20 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Request / Add Custom Unit...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Controls: Quick Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {hasAdminAccess && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40 px-3 py-2 text-xs font-bold text-amber-300 transition shadow-xs"
              >
                <Shield className="h-3.5 w-3.5 text-amber-400" />
                <span>Admin Portal</span>
              </Link>
            )}

            <button
              onClick={() => setIsUploadOpen(true)}
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition"
              title="Upload Lecture Slides or Notes"
            >
              <UploadCloud className="h-3.5 w-3.5 text-blue-400" />
              <span>Upload Notes</span>
            </button>

            {/* User Account / Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0c121e] hover:bg-slate-800/60 p-1.5 sm:px-2.5 sm:py-1.5 transition"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                    {userDisplayName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-white hidden sm:block max-w-[100px] truncate">
                    {userDisplayName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-700 bg-[#0d1322] p-2 shadow-2xl backdrop-blur-md z-50">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{userDisplayName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          setIsOnboardingOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
                        <span>Feature Guide Tour</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          signOut();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 transition"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Hero & Active Course Unit Overview Banner ── */}
      <section className="relative w-full border-b border-slate-800/80 bg-gradient-to-b from-[#0b1329] via-[#090e1f] to-[#070b14] px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Course Metadata & Identity */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Syllabus • 2025/2026 Academic Year</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {currentUnit.code}: {currentUnit.name}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  Unit-isolated academic workstation. Ask questions grounded in lecture notes, generate step-by-step calculus working, and practice timed mock examination papers.
                </p>
              </div>

              {/* Course Meta Details */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-blue-400">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Lecturer</span>
                    <strong className="text-white">{currentUnit.lecturer}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-amber-400">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Lecture Hall</span>
                    <strong className="text-white">{currentUnit.venue || "Main Campus"}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Semester</span>
                    <strong className="text-white">Semester 1 (Year 2)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Academic Illustration Card */}
            <div className="lg:col-span-4">
              <div className="relative rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-[#0c1222] p-5 shadow-xl overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Course Knowledge Vault
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Grounding Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Full lecture slides and un-transcribed university past papers indexed for this unit.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsVaultOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 px-3 text-xs font-bold text-white transition shadow-sm"
                  >
                    <BookMarked className="h-4 w-4" />
                    <span>Real PDF Vault</span>
                  </button>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 p-2.5 text-slate-300 transition"
                    title="Upload Slide Deck"
                  >
                    <UploadCloud className="h-4 w-4 text-blue-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. The 3 AM Daily Study Dossier & Abstractor ── */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <DailyMissionCard briefingMarkdown={briefingMarkdown} onRefresh={() => {}} />
      </section>

      {/* ── 4. Primary Academic Workspace Hub (Visual Action Cards) ── */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-400" />
              <span>Academic Workstation Studios</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a specialized studio to solve assignments, simulate exams, or study oral lectures.
            </p>
          </div>
        </div>

        {/* 6 Studio Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Assignment Studio (#1 Core) */}
          <div
            onClick={() => setIsAssignmentStudioOpen(true)}
            className="group relative rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/30 to-[#0b1220] p-5 hover:border-blue-500/60 transition-all cursor-pointer shadow-md hover:shadow-blue-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 group-hover:scale-105 transition-transform">
                  <Compass className="h-5 w-5" />
                </div>
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 uppercase tracking-wider border border-blue-500/30">
                  #1 Core
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white group-hover:text-blue-300 transition">
                Assignment & Homework Studio
              </h3>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Step-by-step calculus working, line-by-line algebraic simplification, and Mermaid architectural diagrams.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
              <span>Launch Assignment Solver</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Past Exam Questions & Rubric */}
          <div
            onClick={() => setIsPastPapersOpen(true)}
            className="group relative rounded-2xl border border-slate-800 bg-[#090e1c] p-5 hover:border-slate-700 transition-all cursor-pointer shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">UoN Rubrics</span>
              </div>
              <h3 className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition">
                Past Exam Questions & Trends
              </h3>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Topic recurrence predictions, compulsory Section A forecasts, and official 4-part lecturer marking schemes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Explore Exam Trends</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Timed Mock Exam Simulator */}
          <div
            onClick={() => setIsExamSimulatorOpen(true)}
            className="group relative rounded-2xl border border-slate-800 bg-[#090e1c] p-5 hover:border-slate-700 transition-all cursor-pointer shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 group-hover:scale-105 transition-transform">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">70 Marks</span>
              </div>
              <h3 className="text-sm font-extrabold text-white group-hover:text-purple-300 transition">
                Timed Mock Exam Simulator
              </h3>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Sit full 70-mark university final examinations with Section A & B, submit answers, and receive instant grading.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400 group-hover:text-purple-300">
              <span>Start Timed Exam</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Oral Masterclass & Voice Studio */}
          <div
            onClick={() => handleOpenProfessor()}
            className="group relative rounded-2xl border border-slate-800 bg-[#090e1c] p-5 hover:border-slate-700 transition-all cursor-pointer shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
                  <Headphones className="h-5 w-5" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Car Commute Mode</span>
              </div>
              <h3 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition">
                Oral Masterclass Studio
              </h3>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Listen to spoken professor lectures for your slides, with live voice interjection to ask doubts hands-free.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-400 group-hover:text-amber-300">
              <span>Enter Lecture Studio</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Real PDF Slide Vault */}
          <div
            onClick={() => setIsVaultOpen(true)}
            className="group relative rounded-2xl border border-slate-800 bg-[#090e1c] p-5 hover:border-slate-700 transition-all cursor-pointer shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 group-hover:scale-105 transition-transform">
                  <BookMarked className="h-5 w-5" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Original PDFs</span>
              </div>
              <h3 className="text-sm font-extrabold text-white group-hover:text-sky-300 transition">
                Notes & Real PDF Slide Vault
              </h3>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Access verified original PowerPoint slides, syllabus outlines, and past papers without corruptions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-400 group-hover:text-sky-300">
              <span>Open Academic Vault</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Spaced Repetition Flashcards */}
          <div
            onClick={() => setIsFlashcardsOpen(true)}
            className="group relative rounded-2xl border border-slate-800 bg-[#090e1c] p-5 hover:border-slate-700 transition-all cursor-pointer shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">SM-2 Algorithm</span>
              </div>
              <h3 className="text-sm font-extrabold text-white group-hover:text-rose-300 transition">
                Active Recall Flashcards
              </h3>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Reinforce high-yield exam definitions, formulas, andGotchas into long-term memory.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-rose-400 group-hover:text-rose-300">
              <span>Review Flashcards</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Main Workstation: AI Copilot & Synchronized Slide Viewer ── */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              <span>Interactive Course Workstation</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Unit-isolated chat paired directly with your course slide decks.
            </p>
          </div>

          {/* Mobile Workstation Tab Toggle */}
          <div className="flex md:hidden rounded-xl border border-slate-800 bg-[#0a0f1d] p-1">
            <button
              onClick={() => setMobileWorkstationTab("chat")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                mobileWorkstationTab === "chat"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              AI Copilot
            </button>
            <button
              onClick={() => setMobileWorkstationTab("documents")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                mobileWorkstationTab === "documents"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Slide Viewer
            </button>
          </div>
        </div>

        {/* Dual Workstation Grid (Side-by-side on desktop, comfortable scrollable height) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[640px] rounded-2xl border border-slate-800 bg-[#090d18] overflow-hidden shadow-xl">
          {/* Left: Unit-Isolated RAG Chat */}
          <div
            className={`h-full overflow-hidden flex flex-col ${
              mobileWorkstationTab === "chat" ? "flex" : "hidden md:flex"
            }`}
          >
            <ChatView
              unitCode={currentUnit.code}
              unitName={currentUnit.name}
              onSelectCitation={handleCitationSelect}
              onOpenProfessorMode={(topic) => handleOpenProfessor(topic)}
            />
          </div>

          {/* Right: Slide / Doc Viewer with Synchronized Page Citations */}
          <div
            className={`h-full overflow-hidden flex flex-col border-t md:border-t-0 md:border-l border-slate-800/80 ${
              mobileWorkstationTab === "documents" ? "flex" : "hidden md:flex"
            }`}
          >
            <DocumentViewer
              citation={activeCitation}
              selectedUnit={currentUnit.code}
              onClose={() => setActiveCitation(null)}
              onOpenUpload={() => setIsUploadOpen(true)}
              onTeachDocument={(docId, title) => handleOpenProfessor(title, docId, title)}
            />
          </div>
        </div>
      </section>

      {/* ── 6. Course Materials & Past Paper Archive Section ── */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-sky-400" />
              <span>Curriculum Archive: {currentUnit.code}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Upload notes or browse all materials verified for this syllabus.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition shadow-sm"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Slide Deck / Handout</span>
            </button>
            <button
              onClick={() => setIsVaultOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition"
            >
              <BookMarked className="h-4 w-4 text-emerald-400" />
              <span>View Full Vault</span>
            </button>
          </div>
        </div>

        {/* Drag-and-Drop Ingestion Card */}
        <div
          onClick={() => setIsUploadOpen(true)}
          className="rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-blue-500/60 bg-[#090e1c]/40 hover:bg-blue-950/10 p-8 text-center cursor-pointer transition group"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 group-hover:scale-105 transition-transform mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition">
            Drag & drop lecture slides or revision papers
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
            Supports PDF handouts, PowerPoint slides (.pptx), past CAT papers, and Word documents (.docx).
          </p>
        </div>
      </section>

      {/* ── 7. Full Comprehensive University Footer (Always Visible at Bottom) ── */}
      <Footer
        onSelectUnit={(code) => {
          setSelectedUnit(code);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* ── Modals & Studios ── */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        units={allAvailableUnits}
        selectedUnit={currentUnit.code}
        onSuccess={() => {}}
      />

      <PastPaperModal
        isOpen={isPastPapersOpen}
        onClose={() => setIsPastPapersOpen(false)}
        unitCode={currentUnit.code}
      />

      <FlashcardModal
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        unitCode={currentUnit.code}
      />

      <ProfessorLectureStudio
        isOpen={isProfessorOpen}
        onClose={() => setIsProfessorOpen(false)}
        unitCode={currentUnit.code}
        initialTopic={professorTopic}
        initialDocumentId={professorDocId}
      />

      <AcademicVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        units={allAvailableUnits}
        currentUnitCode={currentUnit.code}
        onSelectUnit={(code) => setSelectedUnit(code)}
        onTeachDocument={(docId, title) => handleOpenProfessor(title, docId)}
      />

      <ExamSimulatorModal
        isOpen={isExamSimulatorOpen}
        onClose={() => setIsExamSimulatorOpen(false)}
        units={allAvailableUnits}
        currentUnitCode={currentUnit.code}
      />

      <RevisionQAModal
        isOpen={isRevisionQAOpen}
        onClose={() => setIsRevisionQAOpen(false)}
        units={allAvailableUnits}
        currentUnitCode={currentUnit.code}
      />

      <DocumentPipelinesModal
        isOpen={isPipelinesOpen}
        onClose={() => setIsPipelinesOpen(false)}
        units={allAvailableUnits}
        initialUnit={currentUnit.code}
      />

      <AssignmentStudioModal
        isOpen={isAssignmentStudioOpen}
        onClose={() => setIsAssignmentStudioOpen(false)}
        units={allAvailableUnits}
        currentUnitCode={currentUnit.code}
      />

      <RequestUnitModal
        isOpen={isRequestUnitOpen}
        onClose={() => setIsRequestUnitOpen(false)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      <AuthModal />
    </div>
  );
}
