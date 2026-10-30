"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, FileText, ExternalLink, HelpCircle, Heart, Sparkles } from "lucide-react";

interface FooterProps {
  onSelectUnit?: (code: string) => void;
  onOpenVault?: () => void;
  onOpenOnboarding?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectUnit, onOpenVault, onOpenOnboarding }) => {
  const units = [
    { code: "SCS 3201", name: "Systems Analysis & Design" },
    { code: "SCS 3209", name: "Software Engineering" },
    { code: "SCS 3207", name: "Operating Systems" },
    { code: "SCS 3203", name: "Computer Architecture" },
    { code: "SCS 3205", name: "Knowledge-Based Systems" },
    { code: "SMA 2114", name: "Calculus II" },
    { code: "CSC 3211", name: "Computer Networks" },
  ];

  return (
    <footer className="w-full border-t border-slate-800 bg-[#070b14] text-slate-400 py-8 px-4 sm:px-8 mt-auto shrink-0 z-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Col 1: Brand & University Identity */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold text-sm tracking-tight">EduRAG Scholar</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Autonomous 7-unit academic copilot, vector-indexed textbook knowledge base, and past paper repository for University of Nairobi Chiromo Campus.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>RLS Protected & IEEE/Sommerville Aligned</span>
          </div>
        </div>

        {/* Col 2: Course Units Quick Navigation */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Year 2 Course Units</h4>
          <ul className="space-y-1.5 text-xs">
            {units.slice(0, 4).map((u) => (
              <li key={u.code}>
                <button
                  type="button"
                  onClick={() => onSelectUnit && onSelectUnit(u.code)}
                  className="hover:text-blue-400 transition text-left"
                >
                  <strong className="text-slate-300">{u.code}:</strong> {u.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: More Units & Academic Tools */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Academic Vault & Tools</h4>
          <ul className="space-y-1.5 text-xs">
            {units.slice(4).map((u) => (
              <li key={u.code}>
                <button
                  type="button"
                  onClick={() => onSelectUnit && onSelectUnit(u.code)}
                  className="hover:text-blue-400 transition text-left"
                >
                  <strong className="text-slate-300">{u.code}:</strong> {u.name}
                </button>
              </li>
            ))}
            {onOpenVault && (
              <li>
                <button
                  type="button"
                  onClick={onOpenVault}
                  className="text-blue-400 hover:text-blue-300 transition font-semibold"
                >
                  Browse Real Past Exam Papers &rarr;
                </button>
              </li>
            )}
            {onOpenOnboarding && (
              <li>
                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
                >
                  <HelpCircle className="h-3 w-3" />
                  <span>Restart Onboarding Tour</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Col 4: Platform Policies & Transparency */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Legal & Governance</h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/privacy" className="hover:text-white transition flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Student Privacy Policy</span>
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Student Fair Use & Freedom</span>
              </Link>
            </li>
            <li>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition flex items-center gap-1"
              >
                <span>XML Sitemap</span>
                <ExternalLink className="h-2.5 w-2.5 text-slate-500" />
              </a>
            </li>
            <li>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition flex items-center gap-1"
              >
                <span>Robots.txt</span>
                <ExternalLink className="h-2.5 w-2.5 text-slate-500" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <p>© 2026 EduRAG Scholar • University of Nairobi, Chiromo Campus. All rights reserved.</p>
        <p className="flex items-center gap-1">
          <span>Engineered for CS Year 2 Excellence by</span>
          <span className="text-slate-300 font-semibold">Musa Makeri</span>
        </p>
      </div>
    </footer>
  );
};
