"use client";

import React from "react";
import { GraduationCap, LogOut, Sparkles, UploadCloud, FileCheck2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Unit } from "./Sidebar";

interface HeaderProps {
  currentUnit: Unit;
  onOpenUpload: () => void;
  onOpenPastPapers: () => void;
  onOpenFlashcards: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUnit,
  onOpenUpload,
  onOpenPastPapers,
  onOpenFlashcards,
}) => {
  const { user, signInWithGoogle, signOut, isLoading } = useAuth();

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || null;
  const userEmail = user?.email || null;
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#090d16]/90 px-6 backdrop-blur-md shrink-0">
      {/* Unit Context & Chip */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">{currentUnit.code}</h2>
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400 border border-blue-500/20">
              {currentUnit.venue}
            </span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-1">
            {currentUnit.name} • <span className="text-slate-500">{currentUnit.lecturer}</span>
          </p>
        </div>
      </div>

      {/* Right Controls: Quick Actions & Visible Google Auth */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenUpload}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
        >
          <UploadCloud className="h-3.5 w-3.5 text-blue-400" />
          <span>Upload Notes</span>
        </button>

        {/* Auth Section */}
        {user ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-[#0c121e] px-3 py-1.5 shadow-sm">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userDisplayName || "User"}
                className="h-7 w-7 rounded-full border border-blue-500/50 object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 text-xs font-bold">
                {(userDisplayName || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-tight max-w-[120px] truncate">
                {userDisplayName || "Student"}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight max-w-[120px] truncate">
                {userEmail}
              </p>
            </div>
            <button
              onClick={signOut}
              className="ml-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-slate-600 bg-white hover:bg-slate-100 text-slate-900 px-3.5 py-1.5 text-xs font-bold shadow-lg transition active:scale-95"
            title="Sign in with your Google / Gmail account"
          >
            {/* Google SVG Brand Icon */}
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? "Signing in..." : "Sign in with Google"}</span>
          </button>
        )}
      </div>
    </header>
  );
};
