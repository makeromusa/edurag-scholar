import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Scale, Award, AlertCircle } from "lucide-react";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Terms of Service | EduRAG Scholar",
  description: "Academic integrity, fair use, and platform terms of service for University of Nairobi Chiromo Campus students.",
};

export default function TermsOfServicePage() {
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
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Terms of Service</h1>
            <p className="text-xs text-slate-400">EduRAG Scholar • Academic Integrity & Fair Use Guidelines</p>
          </div>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-8">
          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-400" />
              1. Educational Purpose & Scope
            </h2>
            <p>
              EduRAG Scholar is an educational AI research assistant designed to augment study, review lecture notes, and practice past examination problems for undergraduate students at the University of Nairobi. It is not an automated exam substitute or cheating device.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              2. Academic Integrity & Prohibited Use
            </h2>
            <p>By using this platform, you agree to uphold University of Nairobi Academic Regulations:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
              <li>You may <strong className="text-rose-400">NOT</strong> use this copilot during proctored examinations, quizzes, or supervised CAT sessions without explicit lecturer authorization.</li>
              <li>You may not upload malicious code, executables, copyright-infringing commercial media, or confidential assessment keys.</li>
              <li>Any automated scraping or brute force querying that disrupts server availability is strictly prohibited and subject to rate limiting and IP banning.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
              3. Copyright & Intellectual Property
            </h2>
            <p>
              Course documents, past examination papers, and lecture slides remain the intellectual property of their respective course lecturers and the University of Nairobi. EduRAG Scholar indexes these documents under academic fair dealing exemptions for non-profit study and examination preparation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">4. AI Output Disclaimer</h2>
            <p>
              While EduRAG Scholar utilizes Retrieval-Augmented Generation (RAG) to ground answers directly in prescribed syllabi and textbooks, AI-generated explanations should be cross-referenced with your official lecturer notes. The system developers and faculty hold no liability for examination scores or misinterpretations.
            </p>
          </section>

          <section className="border-t border-slate-800 pt-6">
            <p className="text-xs text-slate-500">
              Last updated: October 2026. University of Nairobi, Chiromo Campus, Department of Computing and Informatics.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
