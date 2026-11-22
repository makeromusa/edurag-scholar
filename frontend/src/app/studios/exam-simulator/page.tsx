"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ExamSimulatorModal } from "@/components/ExamSimulatorModal";
import { DEFAULT_UNITS } from "@/lib/constants";
import { Unit } from "@/components/Sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/AuthContext";
import { BookOpen } from "lucide-react";

function ExamSimulatorContent() {
  const searchParams = useSearchParams();
  const { session, profile } = useAuth();
  const [units, setUnits] = useState<Unit[]>(DEFAULT_UNITS);

  const initialUnit = searchParams.get("unit") || "SCS 3207";
  const [selectedUnit, setSelectedUnit] = useState<string>(initialUnit);

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

  const handleUnitChange = (newUnit: string) => {
    setSelectedUnit(newUnit);
    try {
      localStorage.setItem("edurag_last_unit", newUnit);
    } catch (e) {}
  };

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-[#080c16]">
      {/* Dynamic Unit Switcher Ribbon */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0c1222] px-4 py-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-slate-400">Target Examination Unit:</span>
          <select
            value={selectedUnit}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
          >
            {allAvailableUnits.map((u) => (
              <option key={u.code} value={u.code}>
                {u.code}: {u.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Autonomous 70-Mark University Simulator • Section A & B Rubrics
        </span>
      </div>

      <div className="flex-1">
        <ExamSimulatorModal
          key={selectedUnit}
          isPage={true}
          isOpen={true}
          units={allAvailableUnits}
          currentUnitCode={selectedUnit}
        />
      </div>
    </div>
  );
}

export default function ExamSimulatorPage() {
  return (
    <AuthGuard
      featureName="Timed Exam Simulator Studio"
      description="Timed 70-mark university mock examinations, marking scheme rubrics, and automated AI grading require student authentication."
    >
      <Suspense fallback={<div className="min-h-screen bg-[#080c16] flex items-center justify-center text-white text-xs">Loading Exam Simulator...</div>}>
        <ExamSimulatorContent />
      </Suspense>
    </AuthGuard>
  );
}
