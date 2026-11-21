"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  MessageSquare,
  Headphones,
  FileCheck2,
  Sparkles,
  Shield,
  ArrowRight,
  CheckCircle2,
  UploadCloud,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  User as UserIcon,
  LogOut,
  LogIn,
  Plus,
  Search,
  BookMarked,
  RefreshCw,
  HelpCircle,
  FolderOpen,
  Zap,
  BarChart2,
  Volume2,
  PenLine,
  Brain,
  Star,
} from "lucide-react";
import { Unit } from "@/components/Sidebar";
import { ChatView } from "@/components/ChatView";
import { DocumentViewer, ActiveCitation } from "@/components/DocumentViewer";
import { DailyMissionCard } from "@/components/DailyMissionCard";
import { UploadModal } from "@/components/UploadModal";
import { PastPaperModal } from "@/components/PastPaperModal";
import { FlashcardModal } from "@/components/FlashcardModal";
import { AuthModal } from "@/components/AuthModal";
import { ProfessorLectureStudio } from "@/components/ProfessorLectureStudio";
import { AcademicVaultModal } from "@/components/AcademicVaultModal";
import { ExamSimulatorModal } from "@/components/ExamSimulatorModal";
import { RevisionQAModal } from "@/components/RevisionQAModal";
import { DocumentPipelinesModal } from "@/components/DocumentPipelinesModal";
import { AssignmentStudioModal } from "@/components/AssignmentStudioModal";
import { RequestUnitModal } from "@/components/RequestUnitModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useAuth } from "@/lib/AuthContext";

const DEFAULT_UNITS: Unit[] = [
  { code: "SMA 2114", name: "Differential and Integral Calculus", lecturer: "Dr. Okeyo", venue: "LG01" },
  { code: "SCS 3201", name: "Systems Analysis and Design", lecturer: "Mr. Shonyela Ochukut", venue: "LG01" },
  { code: "SCS 3203", name: "Computer Architecture", lecturer: "Dr. Yohanna", venue: "LG01" },
  { code: "SCS 3205", name: "Knowledge-Based Systems & Programming", lecturer: "Dr. Mutemi", venue: "LG01" },
  { code: "SCS 3207", name: "Operating Systems", lecturer: "Dr. Miriti", venue: "LG01" },
  { code: "SCS 3209", name: "Software Engineering", lecturer: "Mr. Gordon", venue: "LG01" },
  { code: "CSC 3211", name: "Computer Networks", lecturer: "Ms. Ronge", venue: "LG01" },
];

export default function Home() {
  const [units, setUnits] = useState<Unit[]>(DEFAULT_UNITS);
  const [selectedUnit, setSelectedUnit] = useState<string>("SCS 3207");
  const [activeCitation, setActiveCitation] = useState<ActiveCitation | null>(null);

  // Modal open states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPastPapersOpen, setIsPastPapersOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [isProfessorOpen, setIsProfessorOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isExamSimulatorOpen, setIsExamSimulatorOpen] = useState(false);
  const [isRevisionQAOpen, setIsRevisionQAOpen] = useState(false);
  const [isPipelinesOpen, setIsPipelinesOpen] = useState(false);
  const [isAssignmentStudioOpen, setIsAssignmentStudioOpen] = useState(false);
  const [isRequestUnitOpen, setIsRequestUnitOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Professor lecture params
  const [professorTopic, setProfessorTopic] = useState<string | undefined>(undefined);
  const [professorDocId, setProfessorDocId] = useState<string | undefined>(undefined);
  const [professorDocTitle, setProfessorDocTitle] = useState<string | undefined>(undefined);
  const [briefingMarkdown, setBriefingMarkdown] = useState<string | undefined>(undefined);

  // UI state
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [mobileWorkstationTab, setMobileWorkstationTab] = useState<"chat" | "documents">("chat");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const unitDropdownRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const { user, profile, session, isLoading, openAuthModal, signOut, isAdmin } = useAuth();
  const isSuperAdmin = (user?.email || "").toLowerCase() === "makeromusa17@gmail.com";
  const hasAdminAccess = isAdmin || isSuperAdmin;
  const userDisplayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Scholar";
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
        const headers: Record<string, string> = {};
        if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

        const [unitsRes, briefingRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/units`, { headers }),
          fetch(`${apiUrl}/api/briefings/today`, { headers }),
        ]);

        if (unitsRes.status === "fulfilled" && unitsRes.value.ok) {
          const uData = await unitsRes.value.json();
          if (uData.units && uData.units.length > 0) setUnits(uData.units);
        }
        if (briefingRes.status === "fulfilled" && briefingRes.value.ok) {
          const bData = await briefingRes.value.json();
          if (bData.briefing?.markdown_content) setBriefingMarkdown(bData.briefing.markdown_content);
        }
      } catch (e) {
        console.error("Backend offline, using seeded defaults", e);
      }
    };
    fetchData();
  }, [user?.id, session?.access_token]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(e.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const enrolledUnitCodes = (profile?.enrolled_units || []).map((c: string) => c.toUpperCase());
  const unitMap = new Map<string, Unit>();
  units.forEach((u) => unitMap.set(u.code.toUpperCase(), u));
  enrolledUnitCodes.forEach((code: string) => {
    if (!unitMap.has(code)) {
      unitMap.set(code, { code, name: "Custom Enrolled Course", lecturer: "Faculty Lecturer", venue: "Main Campus" });
    }
  });
  const allAvailableUnits = Array.from(unitMap.values());

  const currentUnit =
    allAvailableUnits.find((u) => u.code.toUpperCase() === (selectedUnit || "").toUpperCase()) ||
    allAvailableUnits[0] || { code: selectedUnit || "SCS 3201", name: "Academic Unit", lecturer: "Chief Examiner", venue: "Campus" };

  const handleOpenProfessor = (topic?: string, docId?: string, docTitle?: string) => {
    setProfessorTopic(topic);
    setProfessorDocId(docId);
    setProfessorDocTitle(docTitle);
    setIsProfessorOpen(true);
  };

  const handleCitationSelect = (citation: ActiveCitation) => {
    setActiveCitation(citation);
    setMobileWorkstationTab("documents");
  };

  const studios = [
    {
      icon: <PenLine size={22} />,
      iconClass: "icon-blue",
      badge: "AI Graded",
      badgeClass: "badge-core",
      title: "Assignment & Homework Studio",
      desc: "Step-by-step working, algebraic simplification, proof structuring, and architectural diagrams — all grounded in your course slides.",
      cta: "Launch Assignment Solver",
      onClick: () => setIsAssignmentStudioOpen(true),
    },
    {
      icon: <BarChart2 size={22} />,
      iconClass: "icon-emerald",
      badge: "Past Papers",
      badgeClass: "badge-new",
      title: "Past Exam Questions & Trends",
      desc: "Topic recurrence predictions, compulsory Section A forecasts, and 4-part lecturer marking schemes — from your verified past papers only.",
      cta: "Explore Exam Trends",
      onClick: () => setIsPastPapersOpen(true),
    },
    {
      icon: <FileCheck2 size={22} />,
      iconClass: "icon-indigo",
      badge: "70 Marks",
      badgeClass: "badge-core",
      title: "Timed Mock Exam Simulator",
      desc: "Sit full 70-mark exams with Section A & B, submit answers, and receive instant grading with model answers.",
      cta: "Start Timed Exam",
      onClick: () => setIsExamSimulatorOpen(true),
    },
    {
      icon: <Volume2 size={22} />,
      iconClass: "icon-amber",
      badge: "CAI & Omni Mode",
      badgeClass: "badge-core",
      title: "Oral Masterclass Studio",
      desc: "Listen to spoken professor lectures from your slides with live voice interjection to ask questions hands-free.",
      cta: "Enter Lecture Studio",
      onClick: () => handleOpenProfessor(),
    },
    {
      icon: <FolderOpen size={22} />,
      iconClass: "icon-rose",
      badge: "Original PDFs",
      badgeClass: "badge-core",
      title: "Notes & Real PDF Slide Vault",
      desc: "Access verified original PowerPoint slides, syllabus outlines, and past papers without corruptions.",
      cta: "Open Academic Vault",
      onClick: () => setIsVaultOpen(true),
    },
    {
      icon: <Brain size={22} />,
      iconClass: "icon-violet",
      badge: "SM-2 Algorithm",
      badgeClass: "badge-core",
      title: "Active Recall Flashcards",
      desc: "Reinforce high-yield exam definitions, formulas, and facts into long-term memory using spaced repetition.",
      cta: "Review Flashcards",
      onClick: () => setIsFlashcardsOpen(true),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", overflowX: "hidden", background: "#fff" }}>

      {/* ═══════════════════════════════════════════════════
          SECTION 1 — STICKY NAVBAR
      ═══════════════════════════════════════════════════ */}
      <header className="edurag-header">
        <div className="container-fluid">
          <div className="d-flex align-items-center justify-content-between w-100 gap-2">

            {/* Brand */}
            <Link href="/" className="edurag-logo text-decoration-none d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: 40, height: 40, background: "var(--accent-color)" }}
              >
                <GraduationCap size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ marginBottom: 0 }}>
                  Edu<span>RAG</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--accent-color)",
                      background: "rgba(37,99,235,0.08)",
                      border: "1px solid rgba(37,99,235,0.2)",
                      borderRadius: 6,
                      padding: "1px 7px",
                      marginLeft: 6,
                      fontFamily: "var(--nav-font)",
                      verticalAlign: "middle",
                    }}
                  >
                    Scholar
                  </span>
                </h1>
                <small className="d-none d-sm-block">Academic AI Copilot</small>
              </div>
            </Link>

            {/* Unit selector — hidden on xs */}
            <div
              className="position-relative d-none d-md-flex"
              ref={unitDropdownRef}
              style={{ flex: "0 1 320px" }}
            >
              <button
                className="unit-selector-btn w-100"
                onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
              >
                <BookOpen size={14} style={{ color: "var(--accent-color)", flexShrink: 0 }} />
                <span className="text-truncate flex-1 text-start" style={{ maxWidth: 220 }}>
                  {currentUnit.code} — {currentUnit.name}
                </span>
                <ChevronDown
                  size={14}
                  style={{ transition: "transform 0.2s", transform: isUnitDropdownOpen ? "rotate(180deg)" : "none", flexShrink: 0 }}
                />
              </button>
              {isUnitDropdownOpen && (
                <div className="unit-dropdown">
                  {allAvailableUnits.map((u) => (
                    <div
                      key={u.code}
                      className="unit-dropdown-item"
                      onClick={() => { setSelectedUnit(u.code); setIsUnitDropdownOpen(false); }}
                    >
                      <BookOpen size={13} style={{ color: "var(--accent-color)", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "var(--heading-color)" }}>{u.code}</div>
                        <div style={{ fontSize: 11, color: "#6b7c9e" }}>{u.name}</div>
                      </div>
                      {u.code === selectedUnit && <CheckCircle2 size={13} style={{ color: "var(--accent-color)", marginLeft: "auto" }} />}
                    </div>
                  ))}
                  <div
                    className="unit-dropdown-item"
                    style={{ borderTop: "1px solid #eef1f8" }}
                    onClick={() => { setIsRequestUnitOpen(true); setIsUnitDropdownOpen(false); }}
                  >
                    <Plus size={13} style={{ color: "var(--accent-color)" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-color)" }}>Request a New Unit</span>
                  </div>
                </div>
              )}
            </div>

            {/* Nav links — desktop */}
            <nav className="d-none d-lg-flex align-items-center gap-1 nav-links-desktop">
              <button className="nav-link-pill btn border-0 bg-transparent" onClick={() => setIsVaultOpen(true)}>Vault</button>
              <button className="nav-link-pill btn border-0 bg-transparent" onClick={() => setIsPipelinesOpen(true)}>Documents</button>
              {hasAdminAccess && (
                <Link href="/admin" className="nav-link-pill">Admin</Link>
              )}
            </nav>

            {/* Right: upload + auth */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <button
                className="btn btn-sm d-none d-sm-inline-flex align-items-center gap-1"
                style={{
                  background: "rgba(37,99,235,0.07)",
                  color: "var(--accent-color)",
                  border: "1.5px solid rgba(37,99,235,0.2)",
                  borderRadius: 8,
                  fontFamily: "var(--nav-font)",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "7px 14px",
                }}
                onClick={() => setIsUploadOpen(true)}
              >
                <UploadCloud size={14} /> Upload
              </button>

              {!isLoading && (
                user ? (
                  <div className="position-relative" ref={accountMenuRef}>
                    <button
                      className="user-avatar border-0"
                      onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                      style={{ cursor: "pointer" }}
                    >
                      {userInitial}
                    </button>
                    {isAccountMenuOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 8px)",
                          right: 0,
                          minWidth: 220,
                          background: "#fff",
                          border: "1.5px solid #d1dced",
                          borderRadius: 14,
                          boxShadow: "0 12px 40px rgba(26,44,78,0.14)",
                          zIndex: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f4fb" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--heading-color)" }}>{userDisplayName}</div>
                          <div style={{ fontSize: 11, color: "#6b7c9e", marginTop: 2 }}>{user.email}</div>
                        </div>
                        <button
                          className="unit-dropdown-item w-100 border-0 bg-transparent text-start"
                          onClick={() => { setIsOnboardingOpen(true); setIsAccountMenuOpen(false); }}
                        >
                          <UserIcon size={13} style={{ color: "var(--accent-color)" }} /> Profile & Units
                        </button>
                        {hasAdminAccess && (
                          <Link
                            href="/admin"
                            className="unit-dropdown-item d-block"
                            onClick={() => setIsAccountMenuOpen(false)}
                            style={{ color: "var(--heading-color)", textDecoration: "none" }}
                          >
                            <Shield size={13} style={{ color: "var(--accent-color)" }} /> Admin Dashboard
                          </Link>
                        )}
                        <button
                          className="unit-dropdown-item w-100 border-0 bg-transparent text-start"
                          onClick={() => { signOut(); setIsAccountMenuOpen(false); }}
                          style={{ color: "#e11d48" }}
                        >
                          <LogOut size={13} /> Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button className="btn-sign-in" onClick={openAuthModal}>
                    <LogIn size={14} /> Sign In
                  </button>
                )
              )}

              {/* Mobile hamburger */}
              <button
                className="mobile-nav-toggle d-lg-none"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                aria-label="Toggle navigation"
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>☰</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav panel */}
        {isMobileNavOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              borderBottom: "1px solid #e8ecf4",
              boxShadow: "0 8px 24px rgba(26,44,78,0.1)",
              zIndex: 998,
              padding: "12px 16px",
            }}
          >
            {/* Mobile unit selector */}
            <div className="mb-3">
              <label style={{ fontSize: 10, fontWeight: 700, color: "#6b7c9e", textTransform: "uppercase", letterSpacing: 1 }}>
                Active Unit
              </label>
              <select
                className="form-select form-select-sm mt-1"
                value={selectedUnit}
                onChange={(e) => { setSelectedUnit(e.target.value); setIsMobileNavOpen(false); }}
                style={{ fontFamily: "var(--nav-font)", fontSize: 13, fontWeight: 600, color: "var(--heading-color)", border: "1.5px solid #d1dced", borderRadius: 8 }}
              >
                {allAvailableUnits.map((u) => (
                  <option key={u.code} value={u.code}>{u.code} — {u.name}</option>
                ))}
              </select>
            </div>
            <div className="d-flex flex-column gap-1">
              <button className="nav-link-pill btn border-0 bg-transparent text-start" onClick={() => { setIsVaultOpen(true); setIsMobileNavOpen(false); }}>
                📁 Notes & Vault
              </button>
              <button className="nav-link-pill btn border-0 bg-transparent text-start" onClick={() => { setIsPipelinesOpen(true); setIsMobileNavOpen(false); }}>
                📄 Manage Documents
              </button>
              <button className="nav-link-pill btn border-0 bg-transparent text-start" onClick={() => { setIsUploadOpen(true); setIsMobileNavOpen(false); }}>
                ☁️ Upload Material
              </button>
              <button className="nav-link-pill btn border-0 bg-transparent text-start" onClick={() => { setIsRequestUnitOpen(true); setIsMobileNavOpen(false); }}>
                ➕ Request New Unit
              </button>
            </div>
          </div>
        )}
      </header>


      {/* ═══════════════════════════════════════════════════
          SECTION 2 — HERO
      ═══════════════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="container hero-content">
          <div className="row align-items-center g-5">
            {/* Left col */}
            <div className="col-lg-6">
              <div className="hero-eyebrow">
                <span className="live-dot"></span>
                AI-Powered · Course-Isolated · Zero Hallucination
              </div>
              <h1 className="hero-title">
                Your Academic<br />
                AI Copilot for<br />
                <span className="accent">University Success</span>
              </h1>
              <p className="hero-subtitle">
                Strictly grounded in your course materials — lecture slides, past papers, and revision notes.
                Every answer, exam trend, and explanation traced to verified sources.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <button
                  className="hero-cta-primary"
                  onClick={() => document.getElementById("workstation-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <MessageSquare size={16} /> Ask Your Copilot
                </button>
                <button className="hero-cta-secondary" onClick={() => setIsUploadOpen(true)}>
                  <UploadCloud size={16} /> Upload Your Notes
                </button>
              </div>
              <div className="hero-badges">
                <div className="hero-badge"><CheckCircle2 size={12} /> 7 Course Units</div>
                <div className="hero-badge"><Shield size={12} /> Source-Verified Only</div>
                <div className="hero-badge"><Zap size={12} /> Instant Grading</div>
                <div className="hero-badge"><Star size={12} /> SM-2 Spaced Repetition</div>
              </div>
            </div>

            {/* Right col — active unit card */}
            <div className="col-lg-6 hero-illustration">
              <div className="hero-card">
                <div className="hero-card-title">📌 Active Course Unit</div>
                <div className="hero-unit-chip">
                  <BookOpen size={12} /> {currentUnit.code}
                </div>
                <h3 style={{ color: "#fff", fontFamily: "var(--heading-font)", fontWeight: 700, fontSize: "1.1rem", marginBottom: 6 }}>
                  {currentUnit.name}
                </h3>
                <p style={{ color: "#adc4e8", fontSize: 13, marginBottom: 16 }}>
                  Lecturer: {currentUnit.lecturer} · Venue: {currentUnit.venue}
                </p>

                {/* Quick action buttons inside hero card */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setIsExamSimulatorOpen(true)}
                    style={{
                      background: "rgba(37,99,235,0.25)",
                      border: "1px solid rgba(37,99,235,0.4)",
                      borderRadius: 8,
                      color: "#93c5fd",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontFamily: "var(--nav-font)",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <FileCheck2 size={11} /> Mock Exam
                  </button>
                  <button
                    onClick={() => handleOpenProfessor()}
                    style={{
                      background: "rgba(245,158,11,0.2)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      borderRadius: 8,
                      color: "#fcd34d",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontFamily: "var(--nav-font)",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Volume2 size={11} /> Voice Lecture
                  </button>
                  <button
                    onClick={() => setIsFlashcardsOpen(true)}
                    style={{
                      background: "rgba(139,92,246,0.2)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      borderRadius: 8,
                      color: "#c4b5fd",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontFamily: "var(--nav-font)",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Brain size={11} /> Flashcards
                  </button>
                </div>

                <div className="hero-stat-row">
                  <div className="hero-stat">
                    <span className="hero-stat-num">7+</span>
                    <span className="hero-stat-label">Course Units</span>
                  </div>
                  <div className="hero-stat">
                    <span className="hero-stat-num">120+</span>
                    <span className="hero-stat-label">Pages Indexed</span>
                  </div>
                  <div className="hero-stat">
                    <span className="hero-stat-num">6</span>
                    <span className="hero-stat-label">AI Studios</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 3 — STATS BAR
      ═══════════════════════════════════════════════════ */}
      <section className="stats-section">
        <div className="container">
          <div className="row g-0 align-items-center">
            <div className="col-6 col-md-3 stat-card">
              <span className="stat-number">7</span>
              <span className="stat-label">Course Units</span>
            </div>
            <div className="col-6 col-md-3 stat-card">
              <span className="stat-number">120+</span>
              <span className="stat-label">Documents Indexed</span>
            </div>
            <div className="col-6 col-md-3 stat-card">
              <span className="stat-number">6</span>
              <span className="stat-label">AI-Powered Studios</span>
            </div>
            <div className="col-6 col-md-3 stat-card">
              <span className="stat-number">0%</span>
              <span className="stat-label">Hallucination Rate</span>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 4 — STUDIO CARDS
      ═══════════════════════════════════════════════════ */}
      <section className="studios-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">AI-Powered Learning Studios</span>
            <h2>Everything You Need to Excel</h2>
            <p>
              Six purpose-built academic tools, each strictly grounded in your uploaded course materials.
              No internet guessing — only verified source content.
            </p>
          </div>
          <div className="row g-4">
            {studios.map((studio, idx) => (
              <div key={idx} className="col-md-6 col-lg-4">
                <div className="studio-card" onClick={studio.onClick} role="button">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className={`card-icon ${studio.iconClass}`}>{studio.icon}</div>
                    <span className={`card-badge ${studio.badgeClass}`}>{studio.badge}</span>
                  </div>
                  <h3>{studio.title}</h3>
                  <p>{studio.desc}</p>
                  <div className="card-cta">
                    {studio.cta} <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 5 — DAILY BRIEFING (if available)
      ═══════════════════════════════════════════════════ */}
      {briefingMarkdown && (
        <section className="py-5" style={{ background: "#f4f7fb" }}>
          <div className="container">
            <div className="section-header" style={{ marginBottom: 32 }}>
              <span className="section-label">Today&apos;s Academic Briefing</span>
              <h2>Morning Study Priorities</h2>
            </div>
            <DailyMissionCard
              briefingMarkdown={briefingMarkdown}
            />
          </div>
        </section>
      )}


      {/* ═══════════════════════════════════════════════════
          SECTION 6 — WHY EDURAG
      ═══════════════════════════════════════════════════ */}
      <section className="why-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Why EduRAG Scholar</span>
            <h2>Built for Serious Academic Work</h2>
            <p>Not a generic AI chatbot. A precision academic copilot locked to your course content.</p>
          </div>
          <div className="row g-4 align-items-stretch">
            {/* Left — blue box */}
            <div className="col-lg-4">
              <div className="why-box">
                <h3>Strictly Grounded Intelligence</h3>
                <p>
                  Every response is generated exclusively from your uploaded course materials.
                  Past papers, lecture slides, and revision notes — no external internet content.
                </p>
                <div style={{ marginTop: 20 }}>
                  {[
                    "Course-isolated per unit — no cross-contamination",
                    "Every claim traced to a source document and page",
                    "Exam trends drawn only from your verified past papers",
                  ].map((pt, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                      <CheckCircle2 size={15} style={{ color: "#93c5fd", flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.85)" }}>{pt}</span>
                    </div>
                  ))}
                </div>
                <button className="more-btn" onClick={() => setIsUploadOpen(true)}>
                  Upload Course Material <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Right — 3 feature boxes */}
            <div className="col-lg-8">
              <div className="row g-4 h-100">
                {[
                  {
                    icon: <Shield size={28} />,
                    title: "Zero Hallucination Guarantee",
                    desc: "If a topic is not in your uploaded materials, the system says so explicitly. No fabricated answers.",
                  },
                  {
                    icon: <Clock size={28} />,
                    title: "Exam-Ready in Minutes",
                    desc: "Past paper trend analysis, mock exams, and spaced-repetition flashcards — purpose-built for exam preparation.",
                  },
                  {
                    icon: <Layers size={28} />,
                    title: "Multi-Studio Learning",
                    desc: "Switch between AI chat, voice lectures, written assignments, and flashcards — all from one platform.",
                  },
                ].map((fb, i) => (
                  <div key={i} className="col-sm-6 col-lg-4">
                    <div className="feature-box">
                      <div style={{ color: "var(--accent-color)", marginBottom: 14 }}>{fb.icon}</div>
                      <h4>{fb.title}</h4>
                      <p>{fb.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 7 — INTERACTIVE WORKSTATION
      ═══════════════════════════════════════════════════ */}
      <section id="workstation-section" className="workstation-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Interactive Workstation</span>
            <h2>Ask Your AI Academic Copilot</h2>
            <p>
              Chat with your course materials. Attach past papers, ask step-by-step questions,
              and get source-cited answers from your verified lecture content.
            </p>
          </div>
          <div className="workstation-wrapper">
            {/* Header bar */}
            <div className="workstation-header">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div className="ws-title">
                  <MessageSquare size={15} />
                  Course Workstation
                </div>
                <span className="ws-unit-pill">{currentUnit.code}</span>
                <span
                  style={{ fontSize: 11, color: "#adc4e8", fontFamily: "var(--nav-font)" }}
                  className="d-none d-sm-inline"
                >
                  · {currentUnit.name}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Mobile tab switcher */}
                <div className="d-flex d-md-none gap-1">
                  <button
                    className={`ws-tab ${mobileWorkstationTab === "chat" ? "active" : ""}`}
                    onClick={() => setMobileWorkstationTab("chat")}
                  >
                    Chat
                  </button>
                  <button
                    className={`ws-tab ${mobileWorkstationTab === "documents" ? "active" : ""}`}
                    onClick={() => setMobileWorkstationTab("documents")}
                  >
                    Docs
                  </button>
                </div>
                <button className="ws-action-btn" onClick={() => setIsUploadOpen(true)}>
                  <UploadCloud size={13} />
                  <span className="d-none d-sm-inline">Upload</span>
                </button>
                <button
                  className="ws-action-btn"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onClick={() => setIsPipelinesOpen(true)}
                >
                  <FolderOpen size={13} />
                  <span className="d-none d-sm-inline">Documents</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="workstation-body">
              {/* Chat pane */}
              <div
                className={`flex-column flex-grow-1 ${mobileWorkstationTab === "chat" ? "d-flex" : "d-none d-md-flex"}`}
                style={{ minWidth: 0 }}
              >
                <ChatView
                  unitCode={selectedUnit}
                  unitName={currentUnit.name}
                  onSelectCitation={handleCitationSelect}
                  onOpenProfessorMode={(topic) => handleOpenProfessor(topic)}
                />
              </div>
              {/* Document pane */}
              <div
                className={`flex-column ${mobileWorkstationTab === "documents" ? "d-flex" : "d-none d-md-flex"}`}
                style={{
                  width: "340px",
                  flexShrink: 0,
                  borderLeft: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <DocumentViewer
                  citation={activeCitation}
                  selectedUnit={selectedUnit}
                  onOpenUpload={() => setIsUploadOpen(true)}
                  onTeachDocument={(docId, docTitle) => handleOpenProfessor(undefined, docId, docTitle)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 8 — UPLOAD ZONE
      ═══════════════════════════════════════════════════ */}
      <section className="upload-section">
        <div className="container">
          <div
            className={`upload-zone ${isDragOver ? "drag-over" : ""}`}
            onClick={() => setIsUploadOpen(true)}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); setIsUploadOpen(true); }}
          >
            <UploadCloud className="upload-icon" />
            <h4>Drag & Drop Your Course Materials</h4>
            <p>
              Supports PDF lecture slides, revision papers, past exam papers, and Word documents (.docx)
            </p>
            <div className="mt-4">
              <button
                className="hero-cta-primary"
                style={{ margin: "0 auto" }}
                onClick={(e) => { e.stopPropagation(); setIsUploadOpen(true); }}
              >
                <UploadCloud size={15} /> Choose Files to Upload
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 9 — FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer className="edurag-footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4 footer-brand">
              <span className="footer-logo-text">Edu<span>RAG</span> Scholar</span>
              <p>
                Autonomous academic copilot — grounded in your verified course materials.
                Built for university scholars who demand accuracy and depth.
              </p>
              <div className="d-flex gap-2 mt-3">
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: "rgba(37,99,235,0.2)",
                    color: "#93c5fd",
                    border: "1px solid rgba(37,99,235,0.3)",
                    borderRadius: 50,
                    padding: "3px 10px",
                    fontFamily: "var(--nav-font)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  HLIS Protected
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: "rgba(16,185,129,0.15)",
                    color: "#34d399",
                    border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: 50,
                    padding: "3px 10px",
                    fontFamily: "var(--nav-font)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Source-Verified
                </span>
              </div>
            </div>
            <div className="col-6 col-lg-2">
              <h4>Year 2 Units</h4>
              {DEFAULT_UNITS.map((u) => (
                <button
                  key={u.code}
                  className="d-block border-0 bg-transparent text-start p-0 mb-1"
                  style={{ color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "var(--nav-font)", transition: "color 0.2s" }}
                  onClick={() => setSelectedUnit(u.code)}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#93c5fd")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#94a3b8")}
                >
                  {u.code}
                </button>
              ))}
            </div>
            <div className="col-6 col-lg-3">
              <h4>Academic Vault & Tools</h4>
              {[
                { label: "Knowledge-Based Systems", code: "SCS 3205" },
                { label: "Calculus II", code: "SMA 2114" },
                { label: "Computer Networks", code: "CSC 3211" },
              ].map((it) => (
                <button
                  key={it.code}
                  className="d-block border-0 bg-transparent text-start p-0 mb-1"
                  style={{ color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "var(--nav-font)", transition: "color 0.2s" }}
                  onClick={() => setSelectedUnit(it.code)}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#93c5fd")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#94a3b8")}
                >
                  {it.label}
                </button>
              ))}
              <button
                className="d-block border-0 bg-transparent text-start p-0 mb-1 mt-2"
                style={{ color: "#93c5fd", fontSize: 13, cursor: "pointer", fontFamily: "var(--nav-font)", fontWeight: 600 }}
                onClick={() => setIsVaultOpen(true)}
              >
                Browse Real Past Exam Papers →
              </button>
              <button
                className="d-block border-0 bg-transparent text-start p-0"
                style={{ color: "#93c5fd", fontSize: 13, cursor: "pointer", fontFamily: "var(--nav-font)", fontWeight: 600 }}
                onClick={() => setIsOnboardingOpen(true)}
              >
                Restart Onboarding Tour →
              </button>
            </div>
            <div className="col-6 col-lg-3">
              <h4>Legal & Governance</h4>
              <a href="/privacy" style={{ display: "block", marginBottom: 4 }}>Student Privacy Policy</a>
              <a href="/terms" style={{ display: "block", marginBottom: 4 }}>Student Fair Use & Freedom</a>
              <a href="/sitemap.xml" style={{ display: "block", marginBottom: 4 }}>AI Sitemap</a>
              <a href="/robots.txt" style={{ display: "block" }}>Robots.txt</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
            <span>© EduRAG {new Date().getFullYear()}. All rights reserved.</span>
            <span style={{ fontFamily: "var(--nav-font)", fontSize: 11, color: "#4a6080" }}>
              Enterprise Academic AI & Learning Intelligence
            </span>
          </div>
        </div>
      </footer>


      {/* ═══════════════════════════════════════════════════
          ALL MODALS
      ═══════════════════════════════════════════════════ */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => setIsUploadOpen(false)}
        selectedUnit={selectedUnit}
        units={allAvailableUnits}
      />
      <AuthModal />
      <ProfessorLectureStudio
        isOpen={isProfessorOpen}
        onClose={() => setIsProfessorOpen(false)}
        unitCode={selectedUnit}
        initialTopic={professorTopic}
        initialDocumentId={professorDocId}
      />
      <AcademicVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        units={allAvailableUnits}
        currentUnitCode={selectedUnit}
        onSelectUnit={(code) => setSelectedUnit(code)}
        onTeachDocument={(docId, docTitle) => handleOpenProfessor(undefined, docId, docTitle)}
      />
      <ExamSimulatorModal
        isOpen={isExamSimulatorOpen}
        onClose={() => setIsExamSimulatorOpen(false)}
        units={allAvailableUnits}
        currentUnitCode={selectedUnit}
      />
      <RevisionQAModal
        isOpen={isRevisionQAOpen}
        onClose={() => setIsRevisionQAOpen(false)}
        units={allAvailableUnits}
        currentUnitCode={selectedUnit}
      />
      <AssignmentStudioModal
        isOpen={isAssignmentStudioOpen}
        onClose={() => setIsAssignmentStudioOpen(false)}
        units={allAvailableUnits}
        currentUnitCode={selectedUnit}
      />
      <FlashcardModal
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        unitCode={selectedUnit}
      />
      <PastPaperModal
        isOpen={isPastPapersOpen}
        onClose={() => setIsPastPapersOpen(false)}
        unitCode={selectedUnit}
      />
      <DocumentPipelinesModal
        isOpen={isPipelinesOpen}
        onClose={() => setIsPipelinesOpen(false)}
        units={allAvailableUnits}
        initialUnit={selectedUnit}
      />
      <RequestUnitModal
        isOpen={isRequestUnitOpen}
        onClose={() => setIsRequestUnitOpen(false)}
      />
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}
