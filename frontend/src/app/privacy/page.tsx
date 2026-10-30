import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Database, Server } from "lucide-react";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | EduRAG Scholar",
  description: "Student data privacy, academic record protection, and AI confidentiality policy for University of Nairobi Chiromo Campus.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#080c15] text-slate-300">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#090d16]/95 backdrop-blur px-4 py-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to EduRAG Study Hub</span>
          </Link>
          <span className="text-xs text-slate-500 font-mono">Effective: October 2026</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-slate-400">EduRAG Scholar • University of Nairobi Chiromo Campus</p>
          </div>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-8">
          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-400" />
              1. Our Academic Privacy Commitment
            </h2>
            <p>
              EduRAG Scholar was built specifically for University of Nairobi B.Sc. Computer Science students. We believe your revision notes, exam preparations, weakness areas, and study interactions are strictly private and academic in nature. We comply with the Kenya Data Protection Act (DPA 2019) and international educational confidentiality guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-400" />
              2. Information We Collect
            </h2>
            <p>We only collect data necessary to provide personalized academic retrieval and revision:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
              <li><strong className="text-slate-200">Account Credentials:</strong> Email address, name, and profile avatar supplied during Supabase Auth or Google OAuth registration.</li>
              <li><strong className="text-slate-200">Uploaded Course Materials:</strong> Lecture notes, slides, and exam past papers you explicitly upload for indexing.</li>
              <li><strong className="text-slate-200">Study Transcripts & Flashcards:</strong> Question history, SM-2 flashcard repetition intervals, and mock exam scores to customize your study dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-400" />
              3. Row-Level Security & Data Isolation
            </h2>
            <p>
              Your personal data is isolated at the PostgreSQL database engine using <strong className="text-blue-400">Row-Level Security (RLS)</strong>. Unauthenticated or foreign users cannot query, view, or modify your uploaded files or private flashcards. Public course documents are read-only and communal.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-400" />
              4. AI & Large Language Model (LLM) Processing
            </h2>
            <p>
              When you ask questions, queries and relevant textbook chunks are processed by Google Gemini and Azure OpenAI strictly via private enterprise APIs with zero data training retention. Your questions and course notes are never used to train public foundational models.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">5. Right to Be Forgotten & Account Deletion</h2>
            <p>
              You maintain total ownership of your data. You may permanently delete your account, uploaded documents, and chat records at any time directly through the <strong className="text-rose-400">"Delete Account & Purge Data"</strong> button in your header profile menu.
            </p>
          </section>

          <section className="border-t border-slate-800 pt-6">
            <p className="text-xs text-slate-500">
              For privacy inquiries, contact the platform maintainer at: <span className="text-blue-400">makeromusa17@gmail.com</span> or Chiromo Campus Department of Computing and Informatics.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
