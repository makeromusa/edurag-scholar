"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  KeyRound,
  RefreshCw,
  Plus,
  BookOpen,
  Search,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface AvailableUnit {
  code: string;
  name: string;
  lecturer?: string;
}

const DEFAULT_UNITS: AvailableUnit[] = [
  { code: "CSC 311", name: "Design & Analysis of Algorithms", lecturer: "Prof. Okeyo" },
  { code: "CSC 313", name: "Computer Architecture & Organization", lecturer: "Dr. Wagacha" },
  { code: "CSC 315", name: "Operating Systems Principles", lecturer: "Dr. Miriti" },
  { code: "CSC 317", name: "Advanced Database Systems", lecturer: "Prof. Omwenga" },
  { code: "CSC 323", name: "Software Engineering Principles", lecturer: "Dr. Chepken" },
  { code: "CSC 325", name: "Artificial Intelligence Foundations", lecturer: "Dr. McOnyango" },
  { code: "SMA 301", name: "Ordinary Differential Equations", lecturer: "Prof. Pokhariyal" },
];

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPasswordForEmail,
    resendVerificationEmail,
    refreshProfile,
  } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [signupMethod, setSignupMethod] = useState<"email" | "google">("email");

  // Step 1 Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Google-Style Strong Password Generator
  const generateStrongPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*-_";
    let pwd = "";
    if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
      const randomValues = new Uint32Array(16);
      window.crypto.getRandomValues(randomValues);
      for (let i = 0; i < 16; i++) {
        pwd += chars[randomValues[i] % chars.length];
      }
    } else {
      for (let i = 0; i < 16; i++) {
        pwd += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    setPassword(pwd);
    setShowPassword(true);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(pwd);
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 4500);
      }
    } catch (e) {
      // Non-fatal
    }
  };

  // Step 2 Fields: Unit Enrolment
  const [systemUnits, setSystemUnits] = useState<AvailableUnit[]>(DEFAULT_UNITS);
  const [searchFilter, setSearchFilter] = useState("");
  const [enrolledUnits, setEnrolledUnits] = useState<AvailableUnit[]>([
    DEFAULT_UNITS[0],
    DEFAULT_UNITS[1],
  ]);

  // Custom unit typed from scratch
  const [customCode, setCustomCode] = useState("");
  const [customName, setCustomName] = useState("");
  const [customLecturer, setCustomLecturer] = useState("");
  const [customUnitError, setCustomUnitError] = useState<string | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  // Fetch available units from backend on mount
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const fetchUnits = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
        const res = await fetch(`${apiUrl}/api/units`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.units) && data.units.length > 0) {
            setSystemUnits(data.units);
          }
        }
      } catch (e) {
        // Fallback to DEFAULT_UNITS
      }
    };
    fetchUnits();
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

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

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      setErrorMsg("Please provide a valid university or personal email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    setSignupMethod("email");
    setSignupStep(2);
  };

  const handleGoogleSignupWithUnits = () => {
    setErrorMsg(null);
    if (enrolledUnits.length === 0) {
      setErrorMsg("Please select at least 1 unit or type a custom course before signing up.");
      return;
    }
    try {
      localStorage.setItem("edurag_pending_google_enrolled_units", JSON.stringify(enrolledUnits));
    } catch (e) {}
    signInWithGoogle();
  };

  const handleAddCustomUnit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomUnitError(null);

    const code = customCode.trim().toUpperCase();
    const name = customName.trim();
    const lecturer = customLecturer.trim() || "Department Faculty";

    if (!code || !name) {
      setCustomUnitError("Both Unit Code (e.g. CSC 421) and Unit Name are required.");
      return;
    }

    if (enrolledUnits.some((u) => u.code.toUpperCase() === code)) {
      setCustomUnitError(`Unit ${code} is already in your selected list.`);
      return;
    }

    if (enrolledUnits.length >= 8) {
      setCustomUnitError("Maximum 8 units can be enrolled at one time.");
      return;
    }

    const newUnit: AvailableUnit = { code, name, lecturer };
    setEnrolledUnits([...enrolledUnits, newUnit]);
    setSystemUnits((prev) => {
      if (prev.some((u) => u.code.toUpperCase() === code)) return prev;
      return [...prev, newUnit];
    });
    setCustomCode("");
    setCustomName("");
    setCustomLecturer("");

    // Persist immediately to units table so it is stored in database
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      fetch(`${apiUrl}/api/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, lecturer }),
      }).catch(() => {});
    } catch (e) {}
  };

  const toggleUnitEnrolment = (unit: AvailableUnit) => {
    if (enrolledUnits.some((u) => u.code.toUpperCase() === unit.code.toUpperCase())) {
      setEnrolledUnits(enrolledUnits.filter((u) => u.code.toUpperCase() !== unit.code.toUpperCase()));
    } else {
      if (enrolledUnits.length >= 8) {
        setErrorMsg("Maximum 8 units can be enrolled during signup.");
        return;
      }
      setEnrolledUnits([...enrolledUnits, unit]);
    }
  };

  const handleCompleteSignup = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const cleanEmail = email.trim();
    const unitCodes = enrolledUnits.map((u) => u.code.toUpperCase());

    try {
      const { error, data } = await signUpWithEmail(cleanEmail, password, fullName.trim());
      if (error) {
        const errMsg = (error.message || "").toLowerCase();
        if (errMsg.includes("already registered")) {
          setErrorMsg("This email is already registered. Please sign in instead.");
          setTab("signin");
          setSignupStep(1);
        } else if (errMsg.includes("rate limit") || error.status === 429) {
          setErrorMsg(
            "Supabase Email Rate Limit Exceeded: Supabase restricts verification emails to 3-4 per hour on the free tier. Please wait a few minutes, sign in if you already have an account, or use Google login."
          );
        } else {
          setErrorMsg(error.message || "Failed to create account.");
        }
        setLoading(false);
        return;
      }

      const token = data?.session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";

      // If session exists immediately, enroll custom units & profile units
      if (token) {
        // 1. Post custom units from scratch so they are saved to units table
        for (const u of enrolledUnits) {
          try {
            await fetch(`${apiUrl}/api/units`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                code: u.code,
                name: u.name,
                lecturer: u.lecturer || "Department Faculty",
              }),
            });
          } catch (e) {
            // Non-fatal
          }
        }

        // 2. Save enrolled units to profile
        try {
          await fetch(`${apiUrl}/api/profiles/enroll`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ unit_codes: unitCodes }),
          });
          await refreshProfile();
        } catch (e) {
          // Non-fatal
        }

        closeAuthModal();
      } else {
        // Email confirmation is required by Supabase: persist in localStorage for first login
        try {
          localStorage.setItem("edurag_pending_enrolled_units", JSON.stringify(unitCodes));
        } catch (e) {}

        setSuccessMsg(
          `Account created with ${unitCodes.length} enrolled units! A verification email has been sent to ${cleanEmail}. Please verify your email to log in.`
        );
        setShowResend(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowResend(false);

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithEmail(cleanEmail, password);
      if (error) {
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          setErrorMsg("Email not confirmed yet. Please verify your email before logging in.");
          setShowResend(true);
        } else if (error.message?.toLowerCase().includes("invalid login credentials")) {
          setErrorMsg("Incorrect email or password. Please check your credentials.");
        } else {
          setErrorMsg(error.message || "Failed to sign in. Check your credentials.");
        }
      } else {
        closeAuthModal();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = systemUnits.filter((u) => {
    const q = searchFilter.toLowerCase();
    return u.code.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0a0f1d] p-5 sm:p-7 shadow-2xl transition-all duration-300 max-h-[92vh] flex flex-col ${
          tab === "signup" && signupStep === 2 ? "max-w-2xl" : "max-w-md"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center shrink-0">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/30 to-violet-600/20 text-blue-400 border border-blue-500/30 mb-2.5 shadow-inner">
            {tab === "forgot" ? (
              <KeyRound className="h-5 w-5" />
            ) : tab === "signup" && signupStep === 2 ? (
              <BookOpen className="h-5 w-5 text-violet-400" />
            ) : (
              <UserIcon className="h-5 w-5 text-blue-400" />
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {tab === "signin"
              ? "Welcome Back to EduRAG"
              : tab === "forgot"
              ? "Reset Your Password"
              : signupStep === 1
              ? "Create Your Scholar Account"
              : "Academic Unit Enrolment"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {tab === "signin"
              ? "Sign in to access your unit lecture notes, exams & flashcards"
              : tab === "forgot"
              ? "Enter your registered email to receive a password recovery link"
              : signupStep === 1
              ? "Step 1 of 2: Scholar identity & security credentials"
              : "Step 2 of 2: Select courses or type custom units from scratch (up to 8)"}
          </p>
        </div>

        {/* Tab Switcher (Step 1 only) */}
        {tab !== "forgot" && signupStep === 1 && (
          <div className="mt-4 flex rounded-xl border border-slate-800 bg-slate-900/60 p-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setErrorMsg(null);
                setSuccessMsg(null);
                setShowResend(false);
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                tab === "signin" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setSignupStep(1);
                setErrorMsg(null);
                setSuccessMsg(null);
                setShowResend(false);
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                tab === "signup" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Step Indicator when in signup */}
        {tab === "signup" && (
          <div className="mt-3 flex items-center justify-center gap-2 shrink-0">
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                signupStep === 1 ? "w-8 bg-blue-500" : "w-2.5 bg-blue-500/40"
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                signupStep === 2 ? "w-8 bg-violet-500" : "w-2.5 bg-slate-700"
              }`}
            />
          </div>
        )}

        {/* 1-Click Google OAuth (Only on Step 1) */}
        {tab !== "forgot" && signupStep === 1 && (
          <div className="mt-4 shrink-0">
            {tab === "signin" ? (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 text-xs font-bold shadow-md transition active:scale-[0.99]"
              >
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
                <span>Sign In with Google</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSignupMethod("google");
                  setSignupStep(2);
                }}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-900/40 via-indigo-950/30 to-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold shadow-md transition active:scale-[0.99] group"
              >
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
                <span>Sign Up with Google (Next: Enrol Units)</span>
                <ArrowRight className="h-3.5 w-3.5 text-blue-400 group-hover:translate-x-0.5 transition" />
              </button>
            )}

            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-slate-800"></div>
              <span className="absolute bg-[#0a0f1d] px-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                {tab === "signup" ? "or register with email & password" : "or with email"}
              </span>
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mt-3 shrink-0 flex flex-col gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs text-rose-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {errorMsg.toLowerCase().includes("rate limit") && (
              <div className="mt-2 flex flex-wrap items-center gap-2 pt-1 border-t border-rose-500/20">
                <button
                  type="button"
                  onClick={() => {
                    setTab("signin");
                    setErrorMsg(null);
                  }}
                  className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 text-[11px] font-bold transition shadow-sm"
                >
                  Sign In to Account
                </button>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 text-[11px] font-bold transition"
                >
                  Sign in with Google
                </button>
              </div>
            )}
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
          <div className="mt-3 shrink-0 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="mt-3 overflow-y-auto pr-1 flex-1">
          {tab === "forgot" ? (
            /* Forgot Password Form */
            <form onSubmit={handlePasswordReset} className="space-y-3">
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
                    className="w-full rounded-xl border border-slate-800 bg-[#050811] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
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

              <button
                type="button"
                onClick={() => {
                  setTab("signin");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition pt-2"
              >
                Back to Sign In
              </button>
            </form>
          ) : tab === "signin" ? (
            /* Sign In Form */
            <form onSubmit={handleSignInSubmit} className="space-y-3">
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
                    className="w-full rounded-xl border border-slate-800 bg-[#050811] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
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
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-slate-800 bg-[#050811] py-2 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
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
                    <span>Sign In to Account</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : signupStep === 1 ? (
            /* Sign Up Step 1: Credentials */
            <form onSubmit={handleStep1Next} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Kamau"
                    className="w-full rounded-xl border border-slate-800 bg-[#050811] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@uon.ac.ke or personal email"
                    className="w-full rounded-xl border border-slate-800 bg-[#050811] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Create Password</label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition group"
                    title="Generate a high-security password like Google Chrome does"
                  >
                    <Sparkles className="h-3 w-3 text-amber-400 group-hover:scale-110 transition" />
                    <span>Suggest Strong Password</span>
                  </button>
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="new-password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters (or click suggest above)"
                    className="w-full rounded-xl border border-slate-800 bg-[#050811] py-2 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordCopied && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 animate-in fade-in duration-150">
                    <Check className="h-3 w-3" />
                    <span>✓ Google-grade strong password generated & copied to clipboard!</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-[0.99]"
              >
                <span>Continue to Unit Enrolment</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            /* Sign Up Step 2: Advanced Unit Enrolment (Select + Type From Scratch) */
            <div className="space-y-4">
              {/* Selected Units Summary Chips */}
              <div className="rounded-xl border border-slate-800/80 bg-[#050812] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-xs font-bold text-white">Your Enrolled Courses</span>
                  </div>
                  <span className="text-[11px] font-semibold text-violet-300 bg-violet-950/60 border border-violet-500/30 px-2 py-0.5 rounded-full">
                    {enrolledUnits.length} / 8 Units Selected
                  </span>
                </div>

                {enrolledUnits.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-1">
                    No units chosen yet. Select from curriculum courses below or type your units from scratch.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {enrolledUnits.map((u) => (
                      <span
                        key={u.code}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-950/40 px-2.5 py-1 text-[11px] font-medium text-violet-200 shadow-sm"
                      >
                        <span className="font-bold text-violet-100">{u.code}</span>
                        <span className="text-slate-400 max-w-[120px] truncate">{u.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleUnitEnrolment(u)}
                          className="text-violet-400 hover:text-rose-400 transition ml-0.5"
                          title="Remove unit"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced: Type Unit from Scratch */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-950/10 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600/30 text-blue-400 text-xs font-bold">
                    +
                  </div>
                  <h4 className="text-xs font-bold text-white">Type a Custom Unit from Scratch</h4>
                </div>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  Taking a new course, elective, or postgraduate unit? Enter the code and title directly to initialize isolated AI memory.
                </p>

                {customUnitError && (
                  <div className="mb-2 text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg p-2">
                    {customUnitError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      placeholder="Code (e.g. CSC 421)"
                      className="w-full rounded-lg border border-slate-800 bg-[#060a14] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-semibold uppercase"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Course Title (e.g. Distributed Cloud Computing)"
                      className="w-full rounded-lg border border-slate-800 bg-[#060a14] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={customLecturer}
                    onChange={(e) => setCustomLecturer(e.target.value)}
                    placeholder="Lecturer / Professor (optional)"
                    className="flex-1 rounded-lg border border-slate-800 bg-[#060a14] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomUnit}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Unit</span>
                  </button>
                </div>
              </div>

              {/* Curriculum Units (Select / Filter) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Select Existing Curriculum Units</label>
                  <div className="relative w-44">
                    <Search className="absolute left-2 top-1.5 h-3 w-3 text-slate-500" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filter units..."
                      className="w-full rounded-lg border border-slate-800 bg-[#060a14] py-1 pl-7 pr-2 text-[11px] text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {filteredUnits.map((u) => {
                    const isSelected = enrolledUnits.some((e) => e.code.toUpperCase() === u.code.toUpperCase());
                    return (
                      <button
                        key={u.code}
                        type="button"
                        onClick={() => toggleUnitEnrolment(u)}
                        className={`flex items-start justify-between rounded-xl border p-2 text-left transition ${
                          isSelected
                            ? "border-violet-500/60 bg-violet-950/30 text-white shadow-sm"
                            : "border-slate-800/80 bg-[#060a14] text-slate-300 hover:border-slate-700 hover:bg-[#0c1220]"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-violet-300 truncate">{u.code}</p>
                          <p className="text-[11px] text-slate-300 truncate">{u.name}</p>
                          {u.lecturer && <p className="text-[10px] text-slate-500 truncate">{u.lecturer}</p>}
                        </div>
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                            isSelected ? "bg-violet-600 text-white" : "border border-slate-700 bg-slate-900"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSignupStep(1)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>

                {signupMethod === "google" ? (
                  <button
                    type="button"
                    onClick={handleGoogleSignupWithUnits}
                    disabled={loading || enrolledUnits.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 py-2.5 text-xs font-bold shadow-lg transition active:scale-[0.99] disabled:opacity-50"
                  >
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
                    <span>Sign Up with Google & Enroll ({enrolledUnits.length} Units)</span>
                    <ArrowRight className="h-4 w-4 text-slate-700" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompleteSignup}
                    disabled={loading || enrolledUnits.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Complete Registration & Launch ({enrolledUnits.length} Units)</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center pt-1">
                {signupMethod === "google" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSignupMethod("email");
                      setSignupStep(1);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white transition underline"
                  >
                    Or switch to Email & Password registration
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSignupMethod("google")}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition underline"
                  >
                    Prefer Google? Switch to Google signup instead
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
