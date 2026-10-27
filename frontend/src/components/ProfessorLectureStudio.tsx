"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  GraduationCap,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Layers,
  Search,
  MessageSquare,
  Send,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Menu,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface ProfessorStudioProps {
  isOpen: boolean;
  onClose: () => void;
  unitCode: string;
  initialDocumentId?: string;
  initialTopic?: string;
}

interface DocumentMeta {
  id: string;
  title: string;
  page_count: number;
}

interface LessonItem {
  lesson_id: number;
  title: string;
  start_page: number;
  end_page: number;
  slide_count: number;
  topics: string[];
}

interface SyllabusData {
  document_id: string;
  document_title: string;
  unit_code: string;
  total_pages: number;
  total_lessons: number;
  lessons: LessonItem[];
}

interface OfficeHoursQnA {
  question: string;
  answer: string;
}

export const ProfessorLectureStudio: React.FC<ProfessorStudioProps> = ({
  isOpen,
  onClose,
  unitCode,
  initialDocumentId,
  initialTopic,
}) => {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentId || "");
  const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [lectureMarkdown, setLectureMarkdown] = useState<string>("");
  const [rawSlidesPreview, setRawSlidesPreview] = useState<string>("");
  const [isRawSlidesOpen, setIsRawSlidesOpen] = useState(false);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false);
  const [isLoadingLecture, setIsLoadingLecture] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Office Hours interactive Q&A state
  const [officeHoursList, setOfficeHoursList] = useState<OfficeHoursQnA[]>([]);
  const [studentQuestion, setStudentQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch unit documents on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchUnitDocs = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/documents/list?unit_code=${unitCode}`);
        if (res.ok) {
          const data = await res.json();
          const docList: DocumentMeta[] = data.documents || [];
          setDocuments(docList);

          // If no doc is pre-selected, select the first processed document
          if (!selectedDocId && docList.length > 0) {
            setSelectedDocId(docList[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch unit documents:", err);
      }
    };

    fetchUnitDocs();
  }, [isOpen, unitCode]);

  // Load syllabus whenever selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) return;

    const fetchSyllabus = async () => {
      setIsLoadingSyllabus(true);
      setErrorMsg(null);
      setSyllabus(null);
      setActiveLesson(null);
      setLectureMarkdown("");
      setOfficeHoursList([]);

      try {
        const res = await fetch(`${apiUrl}/api/professor/document/${selectedDocId}/syllabus`);
        if (!res.ok) {
          throw new Error("Failed to generate lesson syllabus for this document.");
        }
        const json = await res.json();
        const data: SyllabusData = json.data;
        setSyllabus(data);

        // Automatically load Lesson 1
        if (data.lessons && data.lessons.length > 0) {
          loadLesson(data.lessons[0], data.document_id);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load syllabus.");
      } finally {
        setIsLoadingSyllabus(false);
      }
    };

    fetchSyllabus();
  }, [selectedDocId]);

  // Load deep professor lecture for a specific lesson batch
  const loadLesson = async (lesson: LessonItem, docId: string) => {
    setActiveLesson(lesson);
    setIsLoadingLecture(true);
    setErrorMsg(null);
    setOfficeHoursList([]);
    setIsSidebarOpen(false); // Close drawer on mobile upon selection

    try {
      const res = await fetch(`${apiUrl}/api/professor/document/lesson`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: docId,
          unit_code: unitCode,
          start_page: lesson.start_page,
          end_page: lesson.end_page,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to load lecture for this lesson.");
      }

      const json = await res.json();
      setLectureMarkdown(json.data.lecture_content);
      setRawSlidesPreview(json.data.raw_slides_preview || "");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate deep lecture.");
    } finally {
      setIsLoadingLecture(false);
    }
  };

  // Search across unit materials to construct curriculum
  const handleSearchCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${apiUrl}/api/professor/curriculum/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_code: unitCode,
          query: searchQuery.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to search course curriculum.");
      }

      const json = await res.json();
      const data = json.data;
      if (data.document_id) {
        setSelectedDocId(data.document_id);
      } else if (data.message) {
        setErrorMsg(data.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  // Submit student doubt in Office Hours
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentQuestion.trim() || !activeLesson || !syllabus) return;

    const q = studentQuestion.trim();
    setStudentQuestion("");
    setIsAsking(true);

    try {
      const res = await fetch(`${apiUrl}/api/professor/document/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: syllabus.document_id,
          unit_code: unitCode,
          start_page: activeLesson.start_page,
          end_page: activeLesson.end_page,
          question: q,
        }),
      });

      if (!res.ok) throw new Error("Office hours request failed.");
      const json = await res.json();
      setOfficeHoursList((prev) => [...prev, { question: q, answer: json.answer }]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to get professor answer.");
    } finally {
      setIsAsking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col h-full sm:h-[96vh] w-full max-w-7xl overflow-hidden rounded-none sm:rounded-2xl border border-indigo-500/30 bg-[#090d16] shadow-2xl">
        
        {/* Top Header Bar */}
        <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#0c111e] px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger to toggle lesson syllabus */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 md:hidden shrink-0"
              aria-label="Toggle Syllabus"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  👨‍🏫 Professor Masterclass Workspace
                </h2>
                <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 border border-indigo-500/20 shrink-0">
                  {unitCode}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Lesson-by-Lesson Abstraction from Slide 1 to End • Teaches in More Detail Than the Slides
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Studio Body: Left Syllabus Navigation + Right Lecture Hall */}
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* Mobile backdrop for drawer */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/60 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* LEFT: Document Selector & Lesson-by-Lesson Syllabus */}
          <aside
            className={`fixed inset-y-0 left-0 z-40 flex h-full w-80 flex-col border-r border-slate-800 bg-[#0a0f1d] text-slate-300 transition-transform duration-300 md:static md:translate-x-0 ${
              isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            }`}
          >
            {/* Document Switcher Dropdown */}
            <div className="p-3.5 border-b border-slate-800 bg-[#0c1222]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Target Book or Slide Deck:
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.page_count} pages)
                  </option>
                ))}
              </select>

              {/* Quick Topic Search Across Unit */}
              <form onSubmit={handleSearchCurriculum} className="mt-2.5 flex items-center gap-1.5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Or search topic / chapter..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || isSearching}
                  className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                  title="Search unit books and slides"
                >
                  {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                </button>
              </form>
            </div>

            {/* Syllabus Lessons List (Slide 1 to End) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Course Lessons
                </span>
                {syllabus && (
                  <span className="rounded bg-indigo-950 border border-indigo-800/40 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                    {syllabus.total_lessons} Lessons • {syllabus.total_pages} Pages
                  </span>
                )}
              </div>

              {isLoadingSyllabus && (
                <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-400" />
                  <p>Organizing slides into lesson batches...</p>
                </div>
              )}

              {syllabus?.lessons?.map((lesson) => {
                const isSelected = activeLesson?.lesson_id === lesson.lesson_id;
                return (
                  <button
                    key={lesson.lesson_id}
                    onClick={() => loadLesson(lesson, syllabus.document_id)}
                    className={`flex w-full flex-col items-start rounded-xl p-3 text-left transition ${
                      isSelected
                        ? "border border-indigo-500/50 bg-indigo-600/20 text-white shadow-md"
                        : "border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className={`text-[11px] font-bold ${isSelected ? "text-indigo-400" : "text-slate-300"}`}>
                        Lesson {lesson.lesson_id}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Slides {lesson.start_page}–{lesson.end_page}
                      </span>
                    </div>
                    <span className="mt-1 text-xs font-semibold text-white line-clamp-1">
                      {lesson.title}
                    </span>
                    {lesson.topics && lesson.topics.length > 0 && (
                      <span className="mt-1 text-[10px] text-slate-500 line-clamp-1">
                        {lesson.topics.join(" • ")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* RIGHT: The Masterclass Lecture Hall */}
          <main className="flex-1 flex flex-col overflow-hidden bg-[#070b13]">
            {activeLesson && (
              <div className="border-b border-slate-800 bg-[#090e1a] px-4 py-3 sm:px-8 flex items-center justify-between gap-3 flex-wrap shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                      Lesson {activeLesson.lesson_id} of {syllabus?.total_lessons}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Slides {activeLesson.start_page}–{activeLesson.end_page} ({activeLesson.slide_count} slides)
                    </span>
                  </div>
                  <h1 className="mt-1 text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
                    {activeLesson.title}
                  </h1>
                </div>

                {/* Toggle Raw Slide Bullets */}
                <button
                  onClick={() => setIsRawSlidesOpen(!isRawSlidesOpen)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                  title="View original bullet points from the slides"
                >
                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{isRawSlidesOpen ? "Hide Slide Bullets" : "Inspect Slide Bullets"}</span>
                  {isRawSlidesOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}

            {/* Lecture Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
              {/* Error Alert */}
              {errorMsg && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Raw Slides Bullets Accordion */}
              {isRawSlidesOpen && rawSlidesPreview && (
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 p-4 sm:p-5 shadow-inner animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    <BookOpen className="h-4 w-4 text-indigo-400" />
                    <span>Raw Slide Bullets (What the Author Stated):</span>
                  </div>
                  <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px] font-mono text-slate-300 p-3 rounded-lg bg-black/60 border border-slate-800">
                    {rawSlidesPreview}
                  </pre>
                  <p className="mt-2 text-[10px] text-slate-500 italic">
                    Notice how brief these bullets are. The professor deconstructs what was left unsaid below.
                  </p>
                </div>
              )}

              {/* Loading Masterclass State */}
              {isLoadingLecture && (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="h-9 w-9 animate-spin text-indigo-400" />
                  <p className="text-sm font-semibold text-white">
                    Professor is delivering Masterclass on Slides {activeLesson?.start_page}–{activeLesson?.end_page}...
                  </p>
                  <p className="text-xs text-slate-400 max-w-md text-center">
                    Unpacking theoretical mechanics, memory maps, C code, and Chiromo Section B exam calculations with GPT-4.1.
                  </p>
                </div>
              )}

              {/* Rendered Deep Professor Masterclass */}
              {!isLoadingLecture && lectureMarkdown && (
                <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-relaxed space-y-4">
                  <ReactMarkdown
                    components={{
                      pre: ({ node, ...props }) => (
                        <pre
                          {...props}
                          className="rounded-xl border border-slate-700 bg-black/80 p-4 text-[11px] sm:text-xs font-mono text-emerald-400 overflow-x-auto shadow-xl"
                        />
                      ),
                      code: ({ node, ...props }) => (
                        <code
                          {...props}
                          className="rounded bg-slate-800/80 px-1.5 py-0.5 text-indigo-300 font-mono text-xs"
                        />
                      ),
                      h1: ({ node, ...props }) => (
                        <h1 {...props} className="text-xl sm:text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-2 mt-4" />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 {...props} className="text-base sm:text-lg font-bold text-indigo-300 tracking-tight mt-6" />
                      ),
                    }}
                  >
                    {lectureMarkdown}
                  </ReactMarkdown>

                  {/* Interactive Office Hours Section */}
                  <div className="mt-10 pt-6 border-t border-slate-800 space-y-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        Interactive Professor Office Hours (Live Doubts for this Lesson)
                      </h3>
                    </div>

                    {/* Q&A Thread */}
                    {officeHoursList.map((item, idx) => (
                      <div key={idx} className="space-y-2 rounded-xl border border-indigo-500/20 bg-indigo-950/15 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px]">Student</span>
                          <span>{item.question}</span>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed border-l-2 border-indigo-400 pl-3">
                          <ReactMarkdown>{item.answer}</ReactMarkdown>
                        </div>
                      </div>
                    ))}

                    {/* Question Input */}
                    <form onSubmit={handleAskQuestion} className="flex gap-2">
                      <input
                        type="text"
                        value={studentQuestion}
                        onChange={(e) => setStudentQuestion(e.target.value)}
                        placeholder={
                          activeLesson
                            ? `Ask the Professor anything regarding Slides ${activeLesson.start_page}–${activeLesson.end_page}...`
                            : "Ask the Professor a question..."
                        }
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!studentQuestion.trim() || isAsking}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition"
                      >
                        {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span>Ask Professor</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Lesson Stepper */}
            {syllabus && activeLesson && (
              <footer className="h-16 border-t border-slate-800 bg-[#0c1222] px-4 sm:px-8 flex items-center justify-between shrink-0">
                <button
                  onClick={() => {
                    const prevIdx = activeLesson.lesson_id - 2;
                    if (prevIdx >= 0) {
                      loadLesson(syllabus.lessons[prevIdx], syllabus.document_id);
                    }
                  }}
                  disabled={activeLesson.lesson_id <= 1 || isLoadingLecture}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous Lesson</span>
                </button>

                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Lesson {activeLesson.lesson_id} of {syllabus.total_lessons} • {syllabus.total_pages} Total Pages
                </span>

                <button
                  onClick={() => {
                    const nextIdx = activeLesson.lesson_id;
                    if (nextIdx < syllabus.lessons.length) {
                      loadLesson(syllabus.lessons[nextIdx], syllabus.document_id);
                    }
                  }}
                  disabled={activeLesson.lesson_id >= syllabus.lessons.length || isLoadingLecture}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-40 transition"
                >
                  <span>
                    {activeLesson.lesson_id < syllabus.lessons.length
                      ? `Next: Lesson ${activeLesson.lesson_id + 1} →`
                      : "Completed Entire Document"}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </footer>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
