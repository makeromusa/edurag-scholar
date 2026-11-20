"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  BookOpen,
  MessageSquare,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  FileText,
  CheckCircle2,
  Compass,
  FileCheck2,
  Sunrise,
  Layers,
  Cpu,
} from "lucide-react";

interface OnboardingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen: controlledOpen,
  onClose: controlledClose,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState(0);

  const isModalOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  useEffect(() => {
    // Check if user has seen onboarding before
    if (controlledOpen === undefined) {
      const hasSeen = localStorage.getItem("edurag_onboarding_v3");
      if (!hasSeen) {
        setInternalOpen(true);
      }
    }
  }, [controlledOpen]);

  const handleComplete = () => {
    localStorage.setItem("edurag_onboarding_v3", "true");
    if (controlledClose) {
      controlledClose();
    } else {
      setInternalOpen(false);
    }
  };

  if (!isModalOpen) return null;

  const slides = [
    {
      badge: "Step 1 of 4 • Course Ecosystem",
      title: "Your Course-Isolated University Copilot",
      subtitle:
        "Engineered specifically for university scholars. Strict course boundaries guarantee zero cross-talk between units.",
      icon: <GraduationCap className="h-7 w-7 text-blue-400" />,
      features: [
        "Pre-indexed curriculum units: Differential & Integral Calculus (SMA 2114), Operating Systems (SCS 3207), Systems Analysis (SCS 3201), Software Engineering (SCS 3209), and Computer Networks (CSC 3211).",
        "Add Any Custom Unit: Click '+ Add Unit' in the sidebar to request or enroll in courses from any Kenyan university or department.",
        "Strict Grounding: Answers are restricted to your actual lecturer notes, slide decks, and prescribed university textbooks.",
      ],
      color: "from-blue-600/20 to-indigo-600/10",
      border: "border-blue-500/30",
    },
    {
      badge: "Step 2 of 4 • Assignment & Calculus Studio",
      title: "Step-by-Step Calculus & Assignment Solver",
      subtitle:
        "Tackle rigorous problem sets, derivatives, integrals, and architecture diagrams with zero hallucinations.",
      icon: <Compass className="h-7 w-7 text-amber-400" />,
      features: [
        "Calculus Line-by-Line Working: State theorems, substitution variables (u, dv), intermediate algebra, and bounds without skipped steps.",
        "Native KaTeX Typesetting: High-contrast, beautifully formatted equations with horizontal scroll cards so math never breaks.",
        "Interactive Diagrams: Generates clean Mermaid flowcharts, state diagrams, and architectural schemas matching lecturer rubrics.",
      ],
      color: "from-amber-600/20 to-orange-600/10",
      border: "border-amber-500/30",
    },
    {
      badge: "Step 3 of 4 • Document Vault & Slide Citations",
      title: "Upload Slide Decks & Real Exam Archives",
      subtitle:
        "Directly upload PowerPoint decks (.pptx), PDF handouts, or past exams and verify facts with clickable citations.",
      icon: <BookOpen className="h-7 w-7 text-emerald-400" />,
      features: [
        "Upload Course Materials: Drag-and-drop lecture slides or exam papers; our background OCR engine splits and indexes them in real-time.",
        "Click-to-Jump Citations: Every AI response includes clickable slide badges [Slide 14] jumping straight to the original lecture page.",
        "Centralized Vault: Filter past papers and syllabus notes by year, category, and unit code with built-in PDF viewer.",
      ],
      color: "from-emerald-600/20 to-teal-600/10",
      border: "border-emerald-500/30",
    },
    {
      badge: "Step 4 of 4 • Abstractor & Mock Exams",
      title: "Daily Study Dossier & Timed Mock Exams",
      subtitle:
        "Never cram the night before an exam again. Autonomous daily revision synchronized with your syllabus.",
      icon: <Sunrise className="h-7 w-7 text-purple-400" />,
      features: [
        "The 3 AM Abstractor: Delivers a structured morning dossier with Today's Mission, 5-Min Active Recall Drill, and Examiner Traps.",
        "Exam Trend Predictor: Analyzes recurring themes across past papers to reveal compulsory Section A questions.",
        "Timed Mock Exam Simulator: Synthesizes realistic 70-mark university final exams with automated lecturer grading and feedback.",
      ],
      color: "from-purple-600/20 to-pink-600/10",
      border: "border-purple-500/30",
    },
  ];

  const current = slides[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-[#0c111d] p-5 sm:p-7 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleComplete}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close onboarding guide"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step Indicator Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-400 mb-3.5">
          <Sparkles className="h-3 w-3" />
          <span>{current.badge}</span>
        </div>

        {/* Hero Card */}
        <div
          className={`rounded-2xl border ${current.border} bg-gradient-to-br ${current.color} p-4 sm:p-5 mb-4 flex items-start gap-3.5`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-md">
            {current.icon}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug">
              {current.title}
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed font-normal">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Bullet Features */}
        <div className="space-y-2.5 mb-5 max-h-[220px] overflow-y-auto pr-1">
          {current.features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Step Dots & Controls */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all ${
                  step === i ? "w-6 bg-blue-500" : "w-2 bg-slate-700 hover:bg-slate-600"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
            )}

            {step < slides.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-md shadow-blue-500/20"
              >
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-500/20"
              >
                <span>Launch Workstation</span>
                <Check className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
