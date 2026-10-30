"use client";

import React, { useState } from "react";
import { GraduationCap, LogOut, Menu, LogIn, UploadCloud, Trash2, ShieldAlert, Loader2, X, ChevronDown, User as UserIcon } from "lucide-react";
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
  const { user, session, signOut, openAuthModal, isLoading } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || null;
  const userEmail = user?.email || null;
  const userAvatar = user?.user_metadata?.avatar_url;

  const handleDeleteAccount = async () => {
    if (!session?.access_token) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to delete account from server.");
      }

      // Successfully purged
      setIsDeleteModalOpen(false);
      setIsAccountMenuOpen(false);
      await signOut();
    } catch (e: any) {
      setDeleteError(e.message || "An unexpected error occurred while deleting your account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#090d16]/95 px-3 sm:px-6 backdrop-blur-md shrink-0 relative z-30">
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
            <div className="relative">
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0c121e] hover:border-slate-700 px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-sm transition"
              >
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
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Account Dropdown Menu */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-[#0c111d] p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="text-xs font-bold text-white truncate">{userDisplayName || "Scholar"}</p>
                    <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                    <span className="inline-block mt-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 rounded px-1.5 py-0.5">
                      RLS Protected Student
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    <LogOut className="h-4 w-4 text-slate-400" />
                    <span>Sign Out</span>
                  </button>

                  <div className="border-t border-slate-800/80 my-1"></div>

                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition"
                  >
                    <Trash2 className="h-4 w-4 text-rose-400" />
                    <span>Delete Account & Purge Data</span>
                  </button>
                </div>
              )}
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

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0c111d] p-6 shadow-2xl">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 mb-3">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-white">Permanently Delete Account?</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              This action cannot be undone. In accordance with data privacy laws, proceeding will permanently purge:
            </p>
            <ul className="mt-2 text-xs text-slate-400 list-disc list-inside space-y-1">
              <li>All notes and course PDFs you uploaded</li>
              <li>Your personal study session transcripts and weakness logs</li>
              <li>Your authentication credentials and profile identity</li>
            </ul>

            {deleteError && (
              <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>Permanently Delete Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
