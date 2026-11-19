"use client";

import React, { useState } from "react";
import { X, Plus, BookOpen, User, Calendar, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface RequestUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnitRequested?: (unit: { code: string; name: string }) => void;
}

export const RequestUnitModal: React.FC<RequestUnitModalProps> = ({
  isOpen,
  onClose,
  onUnitRequested,
}) => {
  const { session, user, openAuthModal } = useAuth();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [lecturer, setLecturer] = useState("");
  const [semester, setSemester] = useState("FIRST SEMESTER");
  const [academicYear, setAcademicYear] = useState("2025/2026");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Please provide both the Course Unit Code (e.g. SCS 3215) and Course Title.");
      return;
    }

    if (!session?.access_token) {
      setError("Please sign in first to submit a unit request. The unit will be linked to your account once approved.");
      openAuthModal();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      };

      const res = await fetch(`${apiUrl}/api/units/request`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          lecturer: lecturer.trim() || "Department Faculty",
          semester,
          academic_year: academicYear,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to submit unit request.");
      }

      setSuccess(true);
      if (onUnitRequested) {
        onUnitRequested({ code: code.trim().toUpperCase(), name: name.trim() });
      }

      setTimeout(() => {
        setSuccess(false);
        setCode("");
        setName("");
        setLecturer("");
        setDescription("");
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Request / Add Custom Unit</h3>
              <p className="text-xs text-slate-400">
                Submit a new course unit for Admin approval (visible only to you)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="my-6 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold text-emerald-300">Unit Request Submitted!</h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Your request for <strong>{code.toUpperCase()}</strong> has been submitted. Once approved by the administrator, it will be activated exclusively for your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {!session && (
              <div className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-950/20 p-3 text-xs text-blue-300">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Sign in required to request units.</span>
                </div>
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-500 transition shrink-0"
                >
                  Sign In
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Unit Code *
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SCS 3215"
                    className="w-full rounded-xl border border-slate-800 bg-[#090d16] pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Lecturer / Faculty
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={lecturer}
                    onChange={(e) => setLecturer(e.target.value)}
                    placeholder="e.g. Dr. Omondi"
                    className="w-full rounded-xl border border-slate-800 bg-[#090d16] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Distributed Computing Systems"
                className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="FIRST SEMESTER">First Semester</option>
                  <option value="SECOND SEMESTER">Second Semester</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Description / Syllabus Topics (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief outline of course topics..."
                rows={2}
                className="w-full rounded-xl border border-slate-800 bg-[#090d16] p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !code.trim() || !name.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50 shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Submit Unit Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
