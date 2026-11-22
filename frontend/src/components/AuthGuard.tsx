"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Lock, GraduationCap, ArrowLeft, ShieldCheck, Sparkles, LogIn } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  featureName?: string;
  description?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  featureName = "Academic Study Workspace",
  description = "Access to verified lecture slides, AI oral tutoring, and university exam simulations requires an active scholar account.",
}) => {
  const { user, isLoading, openAuthModal } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      openAuthModal();
    }
  }, [isLoading, user, openAuthModal]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#080d1a] text-slate-300 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 animate-pulse mb-4">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold tracking-wide text-slate-400">Verifying Scholar Credentials...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#070b14] text-slate-200">
        {/* Navigation Bar */}
        <header className="w-full border-b border-slate-800/80 bg-[#0c1220]/80 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Campus Home</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Protected Academic Workspace</span>
          </div>
        </header>

        {/* Access Gate Card */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md rounded-2xl border border-blue-500/30 bg-[#0e1628]/95 shadow-2xl p-6 sm:p-8 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30">
              <Lock className="h-7 w-7" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2">
                <Sparkles className="h-3 w-3" />
                <span>Scholar Access Gate</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {featureName}
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {description}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#080d18] p-4 text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <GraduationCap className="h-4 w-4 text-blue-400" />
                <span>Included with Student Sign In:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-400 ml-6 list-disc">
                <li>Isolated course vector memory for all enrolled units</li>
                <li>Live professor oral lectures & audio voice interjection</li>
                <li>Timed university examination simulations & auto-marking</li>
                <li>Daily 3 AM autonomous abstractor study briefings</li>
              </ul>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={openAuthModal}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 text-xs font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In with Student Account</span>
              </button>
              <Link
                href="/"
                className="block text-xs font-medium text-slate-400 hover:text-slate-200 transition"
              >
                Explore Syllabus Outlines & Features First →
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
};
