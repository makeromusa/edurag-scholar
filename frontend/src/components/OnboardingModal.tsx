"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap, BookOpen, MessageSquare, Check, ArrowRight, ArrowLeft, X, Sparkles, FileText, CheckCircle2 } from "lucide-react";

interface OnboardingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen: controlledOpen, onClose: controlledClose }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState(0);

  const isModalOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  useEffect(() => {
    // Check if user has seen onboarding before
    if (controlledOpen === undefined) {
      const hasSeen = localStorage.getItem("edurag_onboarding_v2");
      if (!hasSeen) {
        setInternalOpen(true);
      }
    }
  }, [controlledOpen]);

  const handleComplete = () => {
    localStorage.setItem("edurag_onboarding_v2", "true");
    if (controlledClose) {
      controlledClose();
    } else {
      setInternalOpen(false);
    }
  };

  if (!isModalOpen) return null;

  const slides = [
    {
      badge: "Step 1 of 3 • Syllabus Overview",
      title: "Welcome to EduRAG Scholar",
      subtitle: "The autonomous, 7-unit AI revision partner built for University of Nairobi Chiromo Campus B.Sc. Computer Science Year 2.",
      icon: <GraduationCap className="h-8 w-8 text-blue-400" />,
      features: [
        "Pre-indexed for SCS 3201 (SAD), SCS 3209 (SE), SCS 3207 (OS), and all Year 2 units.",
        "Grounding strictly restricted to prescribed textbooks (Kendall & Kendall, Sommerville).",
        "Dual-database architecture: Supabase pgvector + MongoDB Atlas.",
      ],
      color: "from-blue-600/20 to-indigo-600/10",
      border: "border-blue-500/30",
    },
    {
      badge: "Step 2 of 3 • Authentic Course Materials",
      title: "Centralized Academic Vault & Real PDFs",
      subtitle: "No more messy Telegram folders. Access authentic, un-transcribed PDF past exam papers and lecture slides.",
      icon: <BookOpen className="h-8 w-8 text-emerald-400" />,
      features: [
        "Click 'Academic Vault' in sidebar to filter by unit, year, and paper category.",
        "Click 'Open Real PDF' to launch the exact uncorrupted PDF in Adobe or browser tabs.",
        "Built-in PDF toolbar with zoom, page navigation, and instant download.",
      ],
      color: "from-emerald-600/20 to-teal-600/10",
      border: "border-emerald-500/30",
    },
    {
      badge: "Step 3 of 3 • AI Mastery & Active Recall",
      title: "Grounded RAG Copilot & Mock Exams",
      subtitle: "Ask challenging questions and prepare for university exams with verifiable academic citations.",
      icon: <MessageSquare className="h-8 w-8 text-purple-400" />,
      features: [
        "Inline citations `[SCS 3209 | Chapter 4 | p. 14]` link directly to source excerpts.",
        "Interactive SM-2 Spaced Repetition flashcards optimize your long-term memory.",
        "Automated mock exam generator simulates 70-mark UoN final exam questions.",
      ],
      color: "from-purple-600/20 to-pink-600/10",
      border: "border-purple-500/30",
    },
  ];

  const current = slides[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-[#0c111d] p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleComplete}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close onboarding"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step Indicator Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-400 mb-4">
          <Sparkles className="h-3 w-3" />
          <span>{current.badge}</span>
        </div>

        {/* Hero Card */}
        <div className={`rounded-xl border ${current.border} bg-gradient-to-br ${current.color} p-5 mb-5 flex items-start gap-4`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-md">
            {current.icon}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
              {current.title}
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Bullet Features */}
        <div className="space-y-2.5 mb-6">
          {current.features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
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
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}

            {step < slides.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition active:scale-95"
              >
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Start Studying</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
