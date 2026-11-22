"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AssignmentStudioModal } from "@/components/AssignmentStudioModal";
import { DEFAULT_UNITS } from "@/lib/constants";
import { Unit } from "@/components/Sidebar";
import { useAuth } from "@/lib/AuthContext";

function AssignmentStudioContent() {
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

  return (
    <AssignmentStudioModal
      key={selectedUnit}
      isPage={true}
      isOpen={true}
      units={allAvailableUnits}
      currentUnitCode={selectedUnit}
    />
  );
}

export default function AssignmentStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c16] flex items-center justify-center text-white text-xs">Loading Assignment Studio...</div>}>
      <AssignmentStudioContent />
    </Suspense>
  );
}
