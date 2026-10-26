"use client";

import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (tab === "signin") {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) {
          setErrorMsg(error.message || "Failed to sign in. Check your credentials.");
        } else {
          closeAuthModal();
        }
      } else {
        if (password.length < 6) {
          setErrorMsg("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        const { error, data } = await signUpWithEmail(email.trim(), password, fullName.trim());
        if (error) {
          setErrorMsg(error.message || "Failed to create account.");
        } else if (data?.user && !data.session) {
          // Email confirmation is enabled in Supabase
          setSuccessMsg("Account created! Please check your email inbox to verify your email address before signing in.");
        } else {
          closeAuthModal();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#0c111d] p-6 shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-3">
            <UserIcon className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {tab === "signin" ? "Welcome Back to EduRAG" : "Create Your Scholar Account"}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {tab === "signin"
              ? "Access your unit-isolated lecture notes, flashcards & past papers"
              : "Set up your personal academic copilot with isolated storage"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              tab === "signin" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              tab === "signup" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* 1-Click Google OAuth */}
        <div className="mt-5">
          <button
            type="button"
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-white hover:bg-slate-100 text-slate-900 px-4 py-2.5 text-xs font-bold shadow-md transition active:scale-[0.99]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-t border-slate-800"></div>
          <span className="absolute bg-[#0c111d] px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            or with email
          </span>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "signup" && (
            <div>
              <label className="text-xs font-semibold text-slate-300">Full Name (optional)</label>
              <div className="relative mt-1">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Asman Musa"
                  className="w-full rounded-xl border border-slate-800 bg-[#090d16] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@uon.ac.ke or gmail.com"
                className="w-full rounded-xl border border-slate-800 bg-[#090d16] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-slate-800 bg-[#090d16] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{tab === "signin" ? "Sign In to Account" : "Create Account & Verify"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
