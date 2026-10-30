"use client";

import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, ArrowRight, Loader2, KeyRound, RefreshCw, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPasswordForEmail,
    resendVerificationEmail,
  } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  if (!isAuthModalOpen) return null;

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPasswordForEmail(cleanEmail);
      if (error) {
        setErrorMsg(error.message || "Failed to send password reset email.");
      } else {
        setSuccessMsg(`Password reset link sent to ${cleanEmail}! Please check your inbox and spam folder.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      setErrorMsg("Please enter a valid email address first.");
      return;
    }
    setResending(true);
    setErrorMsg(null);
    try {
      const { error } = await resendVerificationEmail(cleanEmail);
      if (error) {
        setErrorMsg(error.message || "Could not resend verification email.");
      } else {
        setSuccessMsg(`Verification email re-sent to ${cleanEmail}!`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend verification.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowResend(false);

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      setErrorMsg("Please provide a valid university or personal email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      if (tab === "signin") {
        const { error } = await signInWithEmail(cleanEmail, password);
        if (error) {
          if (error.message?.toLowerCase().includes("email not confirmed")) {
            setErrorMsg("Email not confirmed yet. Please verify your email before logging in.");
            setShowResend(true);
          } else if (error.message?.toLowerCase().includes("invalid login credentials")) {
            setErrorMsg("Incorrect email or password. Please check your credentials or reset your password.");
          } else {
            setErrorMsg(error.message || "Failed to sign in. Check your credentials.");
          }
        } else {
          closeAuthModal();
        }
      } else {
        const { error, data } = await signUpWithEmail(cleanEmail, password, fullName.trim());
        if (error) {
          if (error.message?.toLowerCase().includes("already registered")) {
            setErrorMsg("This email is already registered. Please sign in instead.");
            setTab("signin");
          } else {
            setErrorMsg(error.message || "Failed to create account.");
          }
        } else if (data?.user && !data.session) {
          // Email confirmation is required by Supabase
          setSuccessMsg(`Account created! A verification link has been sent to ${cleanEmail}. Please verify your email to log in.`);
          setShowResend(true);
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
            {tab === "forgot" ? <KeyRound className="h-6 w-6" /> : <UserIcon className="h-6 w-6" />}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {tab === "signin"
              ? "Welcome Back to EduRAG"
              : tab === "signup"
              ? "Create Your Scholar Account"
              : "Reset Your Password"}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {tab === "signin"
              ? "Access your unit-isolated lecture notes, flashcards & past papers"
              : tab === "signup"
              ? "Set up your personal academic copilot with isolated storage"
              : "Enter your registered email to receive a secure recovery link"}
          </p>
        </div>

        {/* Tab Switcher (Visible only when not in forgot mode) */}
        {tab !== "forgot" ? (
          <div className="mt-6 flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setErrorMsg(null);
                setSuccessMsg(null);
                setShowResend(false);
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
                setShowResend(false);
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                tab === "signup" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {/* 1-Click Google OAuth (Only for sign in/up) */}
        {tab !== "forgot" && (
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
        )}

        {/* Divider */}
        {tab !== "forgot" && (
          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-slate-800"></div>
            <span className="absolute bg-[#0c111d] px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              or with email
            </span>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {showResend && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="self-start ml-6 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline"
              >
                {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                <span>Resend verification email</span>
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Forms: Signin / Signup OR Forgot Password */}
        {tab === "forgot" ? (
          <form onSubmit={handlePasswordReset} className="mt-4 space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300">Registered Email Address</label>
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

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Send Password Reset Link</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        ) : (
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {tab === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab("forgot");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
        )}
      </div>
    </div>
  );
};
