"use client";

import React, { useState } from "react";
import { PastPaperModal } from "@/components/PastPaperModal";

export default function ExamTrendsPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>("SCS 3207");

  return (
    <PastPaperModal
      isPage={true}
      unitCode={selectedUnit}
    />
  );
}
