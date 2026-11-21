"use client";

import React, { useState } from "react";
import { ProfessorLectureStudio } from "@/components/ProfessorLectureStudio";

export default function LectureStudioPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>("SCS 3207");

  return (
    <ProfessorLectureStudio
      isPage={true}
      unitCode={selectedUnit}
    />
  );
}
