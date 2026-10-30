import Link from "next/link";
import { GraduationCap, ArrowLeft, Search, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080c15] text-white flex flex-col items-center justify-center p-6 text-center">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full">
        {/* Academic Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-6 shadow-xl shadow-blue-500/10">
          <GraduationCap className="h-10 w-10" />
        </div>

        {/* 404 Code & Headline */}
        <span className="inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 mb-3">
          Error 404 • Syllabus Route Missing
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Page Not In Curriculum
        </h1>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
          The requested page or document link could not be located in the University of Nairobi Chiromo academic index.
        </p>

        {/* Quick Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Study Hub</span>
          </Link>
          <Link
            href="/?tab=vault"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <BookOpen className="h-4 w-4 text-blue-400" />
            <span>Browse Past Papers</span>
          </Link>
        </div>

        {/* Footer Credit */}
        <div className="mt-12 text-[11px] text-slate-500">
          EduRAG Scholar • B.Sc. Computer Science • University of Nairobi
        </div>
      </div>
    </div>
  );
}
