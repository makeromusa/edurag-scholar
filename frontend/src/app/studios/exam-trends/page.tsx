"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PastPaperModal } from "@/components/PastPaperModal";

function ExamTrendsContent() {
  const searchParams = useSearchParams();
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

  return (
    <PastPaperModal
      key={selectedUnit}
      isPage={true}
      isOpen={true}
      unitCode={selectedUnit}
    />
  );
}

export default function ExamTrendsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c16] flex items-center justify-center text-white text-xs">Loading Exam Trends...</div>}>
      <ExamTrendsContent />
    </Suspense>
  );
}
