"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FlashcardModal } from "@/components/FlashcardModal";
import { AuthGuard } from "@/components/AuthGuard";

function FlashcardsContent() {
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
    <FlashcardModal
      key={selectedUnit}
      isPage={true}
      isOpen={true}
      unitCode={selectedUnit}
    />
  );
}

export default function FlashcardsPage() {
  return (
    <AuthGuard
      featureName="Active Recall Flashcards Studio"
      description="Spaced repetition SM-2 flashcard decks, formula drills, and recall tracking require student sign-in."
    >
      <Suspense fallback={<div className="min-h-screen bg-[#080c16] flex items-center justify-center text-white text-xs">Loading Flashcards...</div>}>
        <FlashcardsContent />
      </Suspense>
    </AuthGuard>
  );
}
