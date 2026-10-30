"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client-side error for observability
    console.error("EduRAG Client Error Boundary caught an exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#080c15] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="relative z-10 max-w-md w-full">
        {/* Error Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 mb-5">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <span className="inline-block rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400 mb-2">
          Runtime Exception Caught
        </span>

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Something Interrupted Your Revision
        </h1>

        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          {error.message || "An unexpected error occurred while rendering the study interface."}
        </p>

        {error.digest && (
          <p className="mt-2 text-[10px] font-mono text-slate-500 bg-slate-900/60 rounded px-2 py-1 inline-block">
            Digest: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <Home className="h-4 w-4" />
            <span>Go to Home Hub</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
