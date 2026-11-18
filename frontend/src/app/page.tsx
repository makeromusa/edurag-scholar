"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  BookOpen,
  Headphones,
  FileCheck2,
  Menu,
  GraduationCap,
  Sparkles,
  Shield,
  ArrowRight,
  CheckCircle2,
  Layers,
  Lock,
} from "lucide-react";
import { Sidebar, Unit } from "@/components/Sidebar";
import { Header } from "@/components/Header";
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
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPastPapersOpen, setIsPastPapersOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [isProfessorOpen, setIsProfessorOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isExamSimulatorOpen, setIsExamSimulatorOpen] = useState(false);
  const [isRevisionQAOpen, setIsRevisionQAOpen] = useState(false);
  const [isPipelinesOpen, setIsPipelinesOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [professorTopic, setProfessorTopic] = useState<string | undefined>(undefined);
  const [professorDocId, setProfessorDocId] = useState<string | undefined>(undefined);
  const [professorDocTitle, setProfessorDocTitle] = useState<string | undefined>(undefined);
  const [briefingMarkdown, setBriefingMarkdown] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "documents">("chat");
  const [desktopLayout, setDesktopLayout] = useState<"split" | "chat" | "documents">("split");
  const { user, profile, isLoading, openAuthModal } = useAuth();

  useEffect(() => {
    // Fetch units and today's briefing from backend
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
        const [unitsRes, briefingRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/units`),
          fetch(`${apiUrl}/api/briefings/today`),
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
  }, [user?.id]);

  // When student profile loads with enrolled units, select their first enrolled unit
  useEffect(() => {
    if (profile?.enrolled_units && profile.enrolled_units.length > 0) {
      const firstEnrolled = profile.enrolled_units[0];
      if (firstEnrolled && selectedUnit !== firstEnrolled) {
        setSelectedUnit(firstEnrolled);
      }
    }
  }, [profile?.enrolled_units]);

  const currentUnit = units.find((u) => u.code === selectedUnit) || units[0];

  const handleOpenProfessor = (topic?: string, docId?: string, docTitle?: string) => {
    setProfessorTopic(topic);
    setProfessorDocId(docId);
    setProfessorDocTitle(docTitle);
    setIsProfessorOpen(true);
  };

  const handleCitationSelect = (citation: ActiveCitation) => {
    setActiveCitation(citation);
    // On mobile devices, automatically switch tab so user sees the document page
    setMobileTab("documents");
  };

  // 🔒 Strict Auth Gate: Unauthenticated visitors must sign up/in before accessing materials
  if (!isLoading && !user) {
    return (
      <main className="min-h-[100dvh] w-screen bg-[#090d16] text-slate-100 flex flex-col justify-between">
        {/* Navigation Bar */}
        <header className="h-16 border-b border-slate-800 bg-[#090d16]/95 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white">EduRAG Scholar</span>
              <p className="text-[10px] text-slate-400">Academic AI Copilot & Knowledge Engine</p>
            </div>
          </div>
          <button
            onClick={openAuthModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Sign In / Register</span>
          </button>
        </header>

        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center flex-1 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-300 mx-auto mb-6">
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            <span>Authentication Required • Enrolled Scholar Access</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Autonomous Academic AI Copilot & Lecture Archive
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Strictly isolated to university course units. Citations to exact slide numbers, past paper mock exams, neural audio lectures taught by your unit lecturers, and SM-2 retention flashcards.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={openAuthModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Get Started • Create Free Student Account</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={openAuthModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-6 py-3.5 text-sm font-semibold text-slate-200 transition cursor-pointer"
            >
              <span>Already Registered? Sign In</span>
            </button>
          </div>

          {/* Features Grid */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 mb-3">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Full Material Access</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Registered students get immediate access to all indexed lecture slides, formulas, and past papers.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 mb-3">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Unit-Isolated RAG</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Zero cross-unit hallucination. Every response cites exact slide numbers and textbook pages.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 mb-3">
                <Headphones className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Oral Masterclasses</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Hands-free spoken lectures and deep technical derivations customized to your specific unit lecturer.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 mb-3">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Mock Exam Simulator</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Full 70-mark university examination papers with step-by-step marking schemes and PDF downloads.
              </p>
            </div>
          </div>
        </div>

        {/* Standard Industry Footer */}
        <footer className="border-t border-slate-800 bg-[#090d16] py-5 px-4 text-center text-xs text-slate-500">
          EduRAG © 2026. All rights reserved. • Enterprise Academic AI & Learning Intelligence
        </footer>

        {/* Universal Auth Modal */}
        <AuthModal />
      </main>
    );
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#090d16]">
      {/* 1. Left Sidebar Navigation (Responsive Drawer on mobile, static on desktop) */}
      <Sidebar
        units={units}
        selectedUnit={selectedUnit}
        onSelectUnit={(code) => {
          setSelectedUnit(code);
          setActiveCitation(null);
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenPastPapers={() => setIsPastPapersOpen(true)}
        onOpenFlashcards={() => setIsFlashcardsOpen(true)}
        onOpenProfessorMode={() => handleOpenProfessor()}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenExamSimulator={() => setIsExamSimulatorOpen(true)}
        onOpenRevisionQA={() => setIsRevisionQAOpen(true)}
        onOpenPipelines={() => setIsPipelinesOpen(true)}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Middle Main Studio: Flows naturally with vertical scroll, no squashed clamping */}
      <div className="flex flex-1 flex-col overflow-y-auto min-w-0 bg-[#090d16]">
        {/* Top Header Bar with Unit Info, Desktop Layout Switcher & Auth */}
        <Header
          currentUnit={currentUnit}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenPastPapers={() => setIsPastPapersOpen(true)}
          onOpenFlashcards={() => setIsFlashcardsOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          desktopLayout={desktopLayout}
          onSelectDesktopLayout={(layout) => setDesktopLayout(layout)}
        />

        {/* Mobile View Switcher Tab (Visible on mobile only) */}
        <div className="flex border-b border-slate-800 bg-[#0c121e] p-1.5 md:hidden shrink-0">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
              mobileTab === "chat" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>AI Copilot</span>
          </button>
          <button
            onClick={() => setMobileTab("documents")}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
              mobileTab === "documents" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Course Materials</span>
          </button>
        </div>

        {/* Compact Daily Mission Card */}
        <div className="px-3 sm:px-6 pt-3 shrink-0">
          <DailyMissionCard
            briefingMarkdown={briefingMarkdown}
            onRefresh={() => {}}
          />
        </div>

        {/* Workstation Studio: Generous, comfortable height so chat & slides are never compressed */}
        <div className="flex min-h-[640px] lg:min-h-[720px] h-[calc(100vh-140px)] shrink-0 border-t border-slate-800/80 mt-3 mx-3 sm:mx-6 rounded-xl overflow-hidden border border-slate-800 bg-[#0c111d] shadow-sm">
          {/* Unit-Isolated RAG Chat */}
          <div
            className={`h-full overflow-hidden flex flex-col ${
              mobileTab === "chat" ? "flex w-full" : "hidden"
            } ${
              desktopLayout === "split"
                ? "md:flex md:w-1/2"
                : desktopLayout === "chat"
                ? "md:flex md:w-full"
                : "md:hidden"
            }`}
          >
            <ChatView
              unitCode={currentUnit.code}
              unitName={currentUnit.name}
              onSelectCitation={handleCitationSelect}
              onOpenProfessorMode={(topic) => handleOpenProfessor(topic)}
            />
          </div>

          {/* Synchronized Slide / Doc Viewer & Library */}
          <div
            className={`h-full overflow-hidden flex flex-col border-l border-slate-800/80 ${
              mobileTab === "documents" ? "flex w-full" : "hidden"
            } ${
              desktopLayout === "split"
                ? "md:flex md:w-1/2"
                : desktopLayout === "documents"
                ? "md:flex md:w-full"
                : "md:hidden"
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

        {/* Mobile Fixed Bottom Navigation Bar (Visible on mobile only, thumbs-friendly) */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-800 bg-[#090d16] py-2 px-1 shrink-0 z-30 mt-auto">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium py-1 px-2 rounded-lg transition ${
              mobileTab === "chat" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Copilot</span>
          </button>
          <button
            onClick={() => setMobileTab("documents")}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium py-1 px-2 rounded-lg transition ${
              mobileTab === "documents" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Slides</span>
          </button>
          <button
            onClick={() => handleOpenProfessor()}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium py-1 px-2 text-slate-400 hover:text-slate-200 transition"
          >
            <Headphones className="h-4 w-4 text-slate-400" />
            <span>Oral Studio</span>
          </button>
          <button
            onClick={() => setIsExamSimulatorOpen(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium py-1 px-2 text-slate-400 hover:text-slate-200 transition"
          >
            <FileCheck2 className="h-4 w-4 text-slate-400" />
            <span>Mock Exam</span>
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium py-1 px-2 text-slate-400 hover:text-slate-200 transition"
          >
            <Menu className="h-4 w-4 text-slate-400" />
            <span>Units</span>
          </button>
        </div>

        {/* Global Directory, Legal & Academic Footer: Sits naturally below the workstation in natural flow */}
        <div className="hidden md:block shrink-0 mt-12 border-t border-slate-800/80 bg-[#090d16]">
          <Footer
            onSelectUnit={(code) => setSelectedUnit(code)}
            onOpenVault={() => setIsVaultOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        units={units}
        selectedUnit={selectedUnit}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <PastPaperModal
        unitCode={selectedUnit}
        isOpen={isPastPapersOpen}
        onClose={() => setIsPastPapersOpen(false)}
      />

      <FlashcardModal
        unitCode={selectedUnit}
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
      />

      {/* Professor Deep Abstraction & Lesson-by-Lesson Lecture Studio */}
      <ProfessorLectureStudio
        isOpen={isProfessorOpen}
        onClose={() => setIsProfessorOpen(false)}
        unitCode={currentUnit.code}
        initialDocumentId={professorDocId}
        initialTopic={professorTopic}
      />

      {/* Centralized Academic Notes & Exam Vault */}
      <AcademicVaultModal
        units={units}
        currentUnitCode={currentUnit.code}
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onSelectUnit={(code) => setSelectedUnit(code)}
        onTeachDocument={(docId, title) => handleOpenProfessor(title, docId, title)}
      />

      {/* Autonomous Full Exam Simulator & PDF Suite */}
      <ExamSimulatorModal
        units={units}
        currentUnitCode={selectedUnit}
        isOpen={isExamSimulatorOpen}
        onClose={() => setIsExamSimulatorOpen(false)}
      />

      {/* Revision Question & Expected Model Solution Companion Suite */}
      <RevisionQAModal
        units={units}
        currentUnitCode={selectedUnit}
        isOpen={isRevisionQAOpen}
        onClose={() => setIsRevisionQAOpen(false)}
      />

      {/* Automated Exam & Answer PDF Pipelines (WeasyPrint / Jinja2 / BackgroundTasks) */}
      <DocumentPipelinesModal
        units={units}
        initialUnit={selectedUnit}
        isOpen={isPipelinesOpen}
        onClose={() => setIsPipelinesOpen(false)}
      />

      {/* Universal Auth Modal (Email/Password + Google OAuth) */}
      <AuthModal />

      {/* 3-Step Interactive Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </main>
  );
}
