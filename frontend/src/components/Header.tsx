"use client";

import React from "react";
import { GraduationCap, LogOut, Menu, LogIn, UploadCloud, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Unit } from "./Sidebar";

interface HeaderProps {
  currentUnit: Unit;
  onOpenUpload: () => void;
  onOpenPastPapers: () => void;
  onOpenFlashcards: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUnit,
  onOpenUpload,
  onOpenPastPapers,
  onOpenFlashcards,
  onToggleMobileSidebar,
}) => {
  const { user, signOut, openAuthModal, isLoading } = useAuth();

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || null;
  const userEmail = user?.email || null;
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#090d16]/95 px-3 sm:px-6 backdrop-blur-md shrink-0">
      {/* Unit Context & Chip */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white md:hidden shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
          <GraduationCap className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">{currentUnit.code}</h2>
            <span className="hidden sm:inline-block rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400 border border-blue-500/20 shrink-0">
              {currentUnit.venue}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
            {currentUnit.name} • <span className="text-slate-500">{currentUnit.lecturer}</span>
          </p>
        </div>
      </div>

      {/* Right Controls: Quick Actions & Single Prominent Auth Button */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onOpenUpload}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
        >
          <UploadCloud className="h-3.5 w-3.5 text-blue-400" />
          <span>Upload Notes</span>
        </button>

        {/* Auth Section */}
        {user ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0c121e] px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-sm">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userDisplayName || "User"}
                className="h-7 w-7 rounded-full border border-blue-500/50 object-cover shrink-0"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 text-xs font-bold shrink-0">
                {(userDisplayName || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-white leading-tight max-w-[120px] truncate">
                {userDisplayName || "Scholar"}
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
            onClick={openAuthModal}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-3.5 py-1.5 text-xs font-bold shadow-md shadow-blue-600/20 transition active:scale-95"
            title="Sign in or create an account"
          >
            <LogIn className="h-4 w-4 shrink-0" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </header>
  );
};
