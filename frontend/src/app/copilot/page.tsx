"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronDown, CheckCircle2, UploadCloud, FolderOpen } from "lucide-react";
import { ChatView } from "@/components/ChatView";
import { DocumentViewer, ActiveCitation } from "@/components/DocumentViewer";
import { UploadModal } from "@/components/UploadModal";
import { DocumentPipelinesModal } from "@/components/DocumentPipelinesModal";
import { DEFAULT_UNITS } from "@/lib/constants";
import { Unit } from "@/components/Sidebar";
import { useAuth } from "@/lib/AuthContext";

function CopilotContent() {
  const searchParams = useSearchParams();
  const { session, profile } = useAuth();
  const [units, setUnits] = useState<Unit[]>(DEFAULT_UNITS);
  const initialUnit = searchParams.get("unit") || "SCS 3207";
  const [selectedUnit, setSelectedUnit] = useState<string>(initialUnit);
  const [activeCitation, setActiveCitation] = useState<ActiveCitation | null>(null);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPipelinesOpen, setIsPipelinesOpen] = useState(false);

  useEffect(() => {
    const urlUnit = searchParams.get("unit");
    if (urlUnit) {
      setSelectedUnit(urlUnit);
    } else {
      const saved = localStorage.getItem("edurag_last_unit");
      if (saved) setSelectedUnit(saved);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
        const headers: Record<string, string> = {};
        if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
        const res = await fetch(`${apiUrl}/api/units`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.units && data.units.length > 0) setUnits(data.units);
        }
      } catch (e) {
        console.error("Backend offline, using defaults", e);
      }
    };
    fetchUnits();
  }, [session?.access_token]);

  const enrolledUnitCodes = (profile?.enrolled_units || []).map((c: string) => c.toUpperCase());
  const unitMap = new Map<string, Unit>();
  units.forEach((u) => unitMap.set(u.code.toUpperCase(), u));
  enrolledUnitCodes.forEach((code: string) => {
    if (!unitMap.has(code)) {
      unitMap.set(code, { code, name: "Custom Enrolled Course", lecturer: "Faculty Lecturer", venue: "Main Campus" });
    }
  });
  const allAvailableUnits = Array.from(unitMap.values());

  const currentUnit =
    allAvailableUnits.find((u) => u.code.toUpperCase() === (selectedUnit || "").toUpperCase()) ||
    allAvailableUnits[0] || { code: selectedUnit || "SCS 3207", name: "Academic Unit", lecturer: "Faculty", venue: "Main" };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Campus Home</span>
            <span className="sm:hidden">Home</span>
          </Link>

          {/* Unit Selector */}
          <div className="relative">
            <button
              onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#1a2c4e] transition"
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-600" />
              <span>{currentUnit.code}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {isUnitDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-1 shadow-lg z-50">
                {allAvailableUnits.map((u) => (
                  <button
                    key={u.code}
                    onClick={() => { setSelectedUnit(u.code); setIsUnitDropdownOpen(false); }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-50 transition"
                  >
                    <div>
                      <span className="font-bold text-[#1a2c4e] block">{u.code}</span>
                      <span className="text-[11px] text-slate-500 truncate block max-w-[190px]">{u.name}</span>
                    </div>
                    {u.code === selectedUnit && <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-xs"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload Materials</span>
          </button>
        </div>
      </header>

      {/* Main Chat Screen - Full Width */}
      <div className="flex-1 flex overflow-hidden">
        <ChatView
          unitCode={selectedUnit}
          unitName={currentUnit.name}
          onSelectCitation={(cit) => setActiveCitation(cit)}
        />
      </div>

      {/* Floating Citation Modal */}
      {activeCitation && (
        <DocumentViewer
          citation={activeCitation}
          selectedUnit={selectedUnit}
          onClose={() => setActiveCitation(null)}
        />
      )}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        selectedUnit={selectedUnit}
        units={allAvailableUnits}
      />
      <DocumentPipelinesModal
        isOpen={isPipelinesOpen}
        onClose={() => setIsPipelinesOpen(false)}
        units={allAvailableUnits}
        initialUnit={selectedUnit}
      />
    </div>
  );
}

export default function DedicatedCopilotPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-600 text-xs font-semibold">Loading Copilot...</div>}>
      <CopilotContent />
    </Suspense>
  );
}
