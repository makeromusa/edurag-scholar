"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, Unit } from "@/components/Sidebar";
import { ChatView } from "@/components/ChatView";
import { DocumentViewer, ActiveCitation } from "@/components/DocumentViewer";
import { DailyMissionCard } from "@/components/DailyMissionCard";
import { UploadModal } from "@/components/UploadModal";
import { PastPaperModal } from "@/components/PastPaperModal";
import { FlashcardModal } from "@/components/FlashcardModal";

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
  const [briefingMarkdown, setBriefingMarkdown] = useState<string | undefined>(undefined);

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

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#080c15]">
      {/* 1. Left Sidebar Navigation */}
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
      />

      {/* 2. Middle Main Studio */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top 3 AM Daily Mission Card */}
        <div className="px-6 pt-5">
          <DailyMissionCard
            briefingMarkdown={briefingMarkdown}
            onRefresh={() => {}}
          />
        </div>

        {/* Split Screen Workstation: Chat on Left, Slide Viewer on Right */}
        <div className="flex flex-1 overflow-hidden border-t border-slate-800/80">
          {/* Unit-Isolated RAG Chat */}
          <div className="w-1/2 flex-1">
            <ChatView
              unitCode={currentUnit.code}
              unitName={currentUnit.name}
              onSelectCitation={(citation) => setActiveCitation(citation)}
            />
          </div>

          {/* Synchronized Slide / Doc Viewer */}
          <div className="w-1/2 flex-1 hidden md:block">
            <DocumentViewer citation={activeCitation} />
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
    </main>
  );
}
