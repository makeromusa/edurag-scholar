"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, BookOpen } from "lucide-react";
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
  const [professorTopic, setProfessorTopic] = useState<string | undefined>(undefined);
  const [professorDocId, setProfessorDocId] = useState<string | undefined>(undefined);
  const [professorDocTitle, setProfessorDocTitle] = useState<string | undefined>(undefined);
  const [briefingMarkdown, setBriefingMarkdown] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "documents">("chat");

  useEffect(() => {
    // Fetch units and today's briefing from backend
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
  }, []);

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

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#080c15]">
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
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Middle Main Studio */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header Bar with Unit Info & Single Auth Entry Point */}
        <Header
          currentUnit={currentUnit}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenPastPapers={() => setIsPastPapersOpen(true)}
          onOpenFlashcards={() => setIsFlashcardsOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Mobile View Switcher Tab (Visible on mobile only) */}
        <div className="flex border-b border-slate-800 bg-[#0c111d] p-1.5 md:hidden">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
              mobileTab === "chat" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>AI Copilot</span>
          </button>
          <button
            onClick={() => setMobileTab("documents")}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
              mobileTab === "documents" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Course Materials</span>
          </button>
        </div>

        {/* Top 3 AM Daily Mission Card */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-4 shrink-0">
          <DailyMissionCard
            briefingMarkdown={briefingMarkdown}
            onRefresh={() => {}}
          />
        </div>

        {/* Workstation: Split Screen on Desktop, Tabbed on Mobile */}
        <div className="flex flex-1 overflow-hidden border-t border-slate-800/80">
          {/* Unit-Isolated RAG Chat */}
          <div
            className={`flex-1 h-full overflow-hidden ${
              mobileTab === "chat" ? "flex flex-col w-full md:w-1/2" : "hidden md:flex md:w-1/2 md:flex-col"
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
            className={`flex-1 h-full overflow-hidden border-l border-slate-800/80 ${
              mobileTab === "documents" ? "flex flex-col w-full md:w-1/2" : "hidden md:flex md:w-1/2 md:flex-col"
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

      {/* Universal Auth Modal (Email/Password + Google OAuth) */}
      <AuthModal />
    </main>
  );
}
