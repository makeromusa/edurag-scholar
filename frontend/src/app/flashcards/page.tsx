"use client";

import React, { useState } from "react";
import { FlashcardModal } from "@/components/FlashcardModal";
import { DEFAULT_UNITS } from "@/lib/constants";

export default function FlashcardsPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>("SCS 3207");

  return (
    <FlashcardModal
      isPage={true}
      unitCode={selectedUnit}
    />
  );
}
