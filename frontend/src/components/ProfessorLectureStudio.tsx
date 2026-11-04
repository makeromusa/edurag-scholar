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
  UploadCloud,
  ListOrdered,
  FileSpreadsheet,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Columns,
  MoveHorizontal,
  Trash2,
  Headphones,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Radio,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/AuthContext";

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

interface IndividualSlideItem {
  page_number: number;
  title: string;
}

interface SyllabusData {
  document_id: string;
  document_title: string;
  unit_code: string;
  total_pages: number;
  total_lessons: number;
  lessons: LessonItem[];
  individual_slides?: IndividualSlideItem[];
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
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentId || "");
  const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [lectureMarkdown, setLectureMarkdown] = useState<string>("");
  const [rawSlidesPreview, setRawSlidesPreview] = useState<string>("");
  const [isRawSlidesOpen, setIsRawSlidesOpen] = useState(true);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false);
  const [isLoadingLecture, setIsLoadingLecture] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dynamic Resizable & Collapsible Navigation Controls
  const [sidebarWidth, setSidebarWidth] = useState<number>(280); // Default ultra-compact 280px (never 80%!)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isFullscreenLecture, setIsFullscreenLecture] = useState<boolean>(false);
  const [lectureLoadingStage, setLectureLoadingStage] = useState<string>("Connecting to Professor Engine...");
  const isResizingRef = useRef<boolean>(false);

  // Drag resizer mouse listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.max(200, Math.min(550, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle syllabus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // View mode in left sidebar: "slides" (individual slide by slide) vs "lessons" (batches)
  const [navMode, setNavMode] = useState<"slides" | "lessons">("slides");
  const [slideSearchTerm, setSlideSearchTerm] = useState("");
  const [jumpSlideInput, setJumpSlideInput] = useState("");

  // Real-time upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  // Office Hours interactive Q&A state
  const [officeHoursList, setOfficeHoursList] = useState<OfficeHoursQnA[]>([]);
  const [studentQuestion, setStudentQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Voice & Car-Commute Player State
  const [isVoiceHUDOpen, setIsVoiceHUDOpen] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("en-GB-RyanNeural");
  const [isConversationalOral, setIsConversationalOral] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isVoiceAnswering, setIsVoiceAnswering] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";

  // Fetch unit documents with student auth token
  const fetchUnitDocs = async () => {
    try {
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`${apiUrl}/api/documents?unit_code=${encodeURIComponent(unitCode)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        let docList: DocumentMeta[] = data.documents || [];

        // If unit specific query returned 0, also fetch general documents for this student
        if (docList.length === 0) {
          const allRes = await fetch(`${apiUrl}/api/documents`, { headers });
          if (allRes.ok) {
            const allData = await allRes.json();
            docList = allData.documents || [];
          }
        }

        setDocuments(docList);

        // Auto-select document: Prioritize complete slide decks & textbooks over brief 2-page outlines
        if (docList.length > 0) {
          if (initialDocumentId && docList.some((d) => d.id === initialDocumentId)) {
            setSelectedDocId(initialDocumentId);
          } else if (!selectedDocId || !docList.some((d) => d.id === selectedDocId)) {
            const preferred =
              docList.find(
                (d) =>
                  d.title.toLowerCase().includes("merged") ||
                  d.title.toLowerCase().includes("slides") ||
                  d.page_count > 10
              ) || docList[0];
            setSelectedDocId(preferred.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch unit documents:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUnitDocs();
    }
  }, [isOpen, unitCode, session?.access_token]);

  // Real-time File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgressText(`Uploading & indexing ${file.name} in real time...`);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("unit_code", unitCode);
      formData.append("file", file);

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${apiUrl}/api/documents/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      let uploadResult: any = {};
      try {
        uploadResult = await res.json();
      } catch (e) {
        uploadResult = { detail: `Server returned HTTP ${res.status}.` };
      }

      if (!res.ok) {
        throw new Error(uploadResult.detail || "Failed to upload document.");
      }

      const newDocId = uploadResult.document_id;

      // Refresh documents dropdown list
      await fetchUnitDocs();

      // Automatically select newly uploaded document and begin teaching
      if (newDocId) {
        setSelectedDocId(newDocId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed. Please check file format.");
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete selected document and purge its vector embeddings
  const handleDeleteSelectedDoc = async () => {
    if (!selectedDocId) return;
    const docToDelete = documents.find((d) => d.id === selectedDocId);
    const title = docToDelete?.title || "this document";
    if (!window.confirm(`Are you sure you want to delete "${title}" and purge all its indexed vectors?`)) {
      return;
    }
    try {
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`${apiUrl}/api/documents/${selectedDocId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== selectedDocId));
        setSelectedDocId("");
        setSyllabus(null);
        setActiveLesson(null);
        setLectureMarkdown("");
        setRawSlidesPreview("");
        await fetchUnitDocs();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to delete document.");
      }
    } catch (e: any) {
      alert(`Error deleting document: ${e.message}`);
    }
  };

  // Load syllabus and all individual slides whenever selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) return;

    const fetchSyllabus = async () => {
      setIsLoadingSyllabus(true);
      setErrorMsg(null);
      setSyllabus(null);
      setActiveLesson(null);
      setLectureMarkdown("");
      setRawSlidesPreview("");
      setOfficeHoursList([]);

      try {
        const res = await fetch(`${apiUrl}/api/professor/document/${selectedDocId}/syllabus`);
        if (!res.ok) {
          throw new Error("Failed to generate lesson syllabus for this document.");
        }
        const json = await res.json();
        const data: SyllabusData = json.data;
        setSyllabus(data);

        // Automatically load Slide 1 or Lesson 1
        if (data.individual_slides && data.individual_slides.length > 0) {
          loadSingleSlide(1, data);
        } else if (data.lessons && data.lessons.length > 0) {
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

  // Load an individual slide directly
  const loadSingleSlide = async (pageNumber: number, currentSyllabus?: SyllabusData) => {
    const activeSyl = currentSyllabus || syllabus;
    if (!activeSyl) return;

    const slideMeta = activeSyl.individual_slides?.find((s) => s.page_number === pageNumber);
    const title = slideMeta?.title || `Slide ${pageNumber}`;

    const singleLesson: LessonItem = {
      lesson_id: pageNumber,
      title: title,
      start_page: pageNumber,
      end_page: pageNumber,
      slide_count: 1,
      topics: [title],
    };

    await loadLesson(singleLesson, activeSyl.document_id);
  };

  // Load deep professor lecture for a specific lesson or slide
  const loadLesson = async (lesson: LessonItem, docId: string) => {
    setActiveLesson(lesson);
    setIsLoadingLecture(true);
    setErrorMsg(null);
    setOfficeHoursList([]);
    setIsSidebarOpen(false); // Close drawer on mobile upon selection
    setLectureLoadingStage("Fetching slide context (<50ms)...");

    // 1. Immediately fetch the raw slide text in < 100ms so user has instant content!
    try {
      const isBatch = lesson.start_page !== lesson.end_page;
      const url = isBatch
        ? `${apiUrl}/api/professor/document/${docId}/batch-raw?start_page=${lesson.start_page}&end_page=${lesson.end_page}`
        : `${apiUrl}/api/professor/document/${docId}/slide/${lesson.start_page}`;
      const rawRes = await fetch(url);
      if (rawRes.ok) {
        const rawJson = await rawRes.json();
        if (rawJson.data?.content) {
          setRawSlidesPreview(rawJson.data.content);
        }
      }
    } catch (re) {
      console.debug("Quick slide fetch skipped:", re);
    }

    setLectureLoadingStage("Synthesizing deep theoretical mechanics & code with GPT-4.1...");

    // 2. Fetch the deep masterclass expansion from backend with timeout & retry
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 75000);

    let fetchSuccess = false;
    for (let attempt = 1; attempt <= 2 && !fetchSuccess; attempt++) {
      try {
        if (attempt === 2) {
          setLectureLoadingStage("Finalizing lecture structure and Section B exam gotchas...");
        }

        const res = await fetch(`${apiUrl}/api/professor/document/lesson`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            document_id: docId,
            unit_code: unitCode,
            start_page: lesson.start_page,
            end_page: lesson.end_page,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Server was busy generating masterclass.");
        }

        const json = await res.json();
        setLectureMarkdown(json.data.lecture_content);
        if (json.data.raw_slides_preview) {
          setRawSlidesPreview(json.data.raw_slides_preview);
        }
        fetchSuccess = true;
      } catch (err: any) {
        if (attempt === 1 && err.name !== "AbortError") {
          console.warn("Attempt 1 failed, retrying masterclass synthesis...", err);
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        const isTimeout = err.name === "AbortError";
        setErrorMsg(
          isTimeout
            ? "Masterclass generation took longer than 75s. Raw slide content is loaded above — click 'Retry Deep Lecture' to re-run."
            : err.message || "Failed to generate deep masterclass."
        );
      }
    }
    clearTimeout(timeoutId);
    setIsLoadingLecture(false);
  };

  // Jump to specific slide number handler
  const handleJumpToSlide = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpSlideInput.trim(), 10);
    if (!pageNum || isNaN(pageNum) || !syllabus) return;

    const clamped = Math.max(1, Math.min(pageNum, syllabus.total_pages));
    if (navMode === "lessons") {
      const batch = syllabus.lessons?.find((l) => l.start_page <= clamped && l.end_page >= clamped);
      if (batch) {
        loadLesson(batch, syllabus.document_id);
        setJumpSlideInput("");
        return;
      }
    }
    loadSingleSlide(clamped);
    setJumpSlideInput("");
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

  // Stop audio on unmount or modal close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // MediaSession API setup for Car Lockscreen, Apple CarPlay & Bluetooth controls
  useEffect(() => {
    if (typeof window !== "undefined" && "mediaSession" in navigator && activeLesson) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeLesson.title,
        artist: `👨‍🏫 Professor Masterclass (${unitCode})`,
        album: syllabus?.document_title || "EduRAG Scholar",
      });

      navigator.mediaSession.setActionHandler("play", () => {
        audioRef.current?.play();
        setIsPlayingVoice(true);
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        audioRef.current?.pause();
        setIsPlayingVoice(false);
      });
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 15);
      });
    }
  }, [activeLesson, syllabus, unitCode]);

  // Format seconds to mm:ss
  const formatAudioTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Play / Pause Lecture Voice
  const toggleLectureAudio = async () => {
    if (!activeLesson || !syllabus) return;

    if (audioRef.current && audioRef.current.src && !audioRef.current.ended) {
      if (isPlayingVoice) {
        audioRef.current.pause();
        setIsPlayingVoice(false);
        return;
      } else {
        try {
          await audioRef.current.play();
          setIsPlayingVoice(true);
          return;
        } catch (e) {
          console.debug("Resume audio failed, will re-synthesize:", e);
        }
      }
    }

    setIsSynthesizingVoice(true);
    setIsVoiceHUDOpen(true);

    try {
      const streamUrl = `${apiUrl}/api/professor/voice/stream-lecture?document_id=${syllabus.document_id}&start_page=${activeLesson.start_page}&end_page=${activeLesson.end_page}&voice=${selectedVoice}&conversational=${isConversationalOral}&_t=${Date.now()}`;

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.src = streamUrl;
      audio.playbackRate = playbackSpeed;

      audio.onplay = () => setIsPlayingVoice(true);
      audio.onpause = () => setIsPlayingVoice(false);
      audio.ontimeupdate = () => {
        setAudioProgress(audio.currentTime);
        setAudioDuration(audio.duration || 0);
      };

      audio.onended = () => {
        setIsPlayingVoice(false);
        // Continuous auto-advance in car mode
        if (navMode === "lessons") {
          const lessons = syllabus.lessons || [];
          const curIdx = lessons.findIndex(
            (l) => l.start_page === activeLesson.start_page && l.end_page === activeLesson.end_page
          );
          if (curIdx !== -1 && curIdx < lessons.length - 1) {
            loadLesson(lessons[curIdx + 1], syllabus.document_id);
          }
        } else {
          if (activeLesson.end_page < syllabus.total_pages) {
            loadSingleSlide(activeLesson.end_page + 1);
          }
        }
      };

      await audio.play();
      setIsPlayingVoice(true);
    } catch (err: any) {
      console.error("Audio playback error:", err);
      setErrorMsg("Failed to start voice lecture. Please try again.");
    } finally {
      setIsSynthesizingVoice(false);
    }
  };

  // Change playback speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Student Voice Interjection (Mic)
  const handleToggleVoiceMic = () => {
    if (isListeningMic) {
      recognitionRef.current?.stop();
      setIsListeningMic(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. You can type your doubt in Office Hours below!");
      return;
    }

    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlayingVoice(false);
    }

    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListeningMic(true);
      setVoiceTranscript("");
    };

    recognition.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => (r as any)[0].transcript)
        .join("");
      setVoiceTranscript(text);
    };

    recognition.onerror = (e: any) => {
      console.warn("Mic speech error:", e);
      setIsListeningMic(false);
    };

    recognition.onend = async () => {
      setIsListeningMic(false);
      if (voiceTranscript.trim() && syllabus && activeLesson) {
        await submitVoiceQuestion(voiceTranscript.trim());
      }
    };

    recognition.start();
  };

  const submitVoiceQuestion = async (q: string) => {
    if (!syllabus || !activeLesson) return;
    setIsVoiceAnswering(true);
    try {
      const res = await fetch(`${apiUrl}/api/professor/voice/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: syllabus.document_id,
          unit_code: unitCode,
          start_page: activeLesson.start_page,
          end_page: activeLesson.end_page,
          question: q,
          voice: selectedVoice,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setOfficeHoursList((prev) => [...prev, { question: q, answer: json.answer_text }]);
        if (json.audio_base64) {
          const answerAudio = new Audio(json.audio_base64);
          answerAudio.playbackRate = playbackSpeed;
          await answerAudio.play();
        }
      }
    } catch (e) {
      console.error("Voice question error:", e);
    } finally {
      setIsVoiceAnswering(false);
      setVoiceTranscript("");
    }
  };

  if (!isOpen) return null;

  // Filter individual slides by search term
  const filteredSlides = (syllabus?.individual_slides || []).filter((s) => {
    if (!slideSearchTerm.trim()) return true;
    const term = slideSearchTerm.toLowerCase();
    return s.title.toLowerCase().includes(term) || s.page_number.toString() === term;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative flex flex-col h-full ${isFullscreenLecture ? "h-full w-full max-w-none rounded-none" : "sm:h-[96vh] w-full max-w-7xl rounded-none sm:rounded-2xl"} overflow-hidden border border-indigo-500/30 bg-[#090d16] shadow-2xl transition-all duration-200`}>
        
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

            {/* Desktop Navigation Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition shrink-0"
              title={isSidebarCollapsed ? "Show Syllabus Navigation (Ctrl+B)" : "Hide Syllabus Navigation (Ctrl+B)"}
            >
              {isSidebarCollapsed ? (
                <>
                  <PanelLeftOpen className="h-4 w-4 text-indigo-400" />
                  <span>Show Syllabus</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4 text-slate-400" />
                  <span>Hide Syllabus</span>
                </>
              )}
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
                Individual Slide-by-Slide & Lesson Abstraction • In Far Greater Detail Than The Slides
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Fullscreen / Focus Mode Toggle */}
            <button
              onClick={() => setIsFullscreenLecture(!isFullscreenLecture)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title={isFullscreenLecture ? "Exit Focus Mode" : "Full Screen Focus Mode"}
            >
              {isFullscreenLecture ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
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

          {/* LEFT PANE: Document Selector, Real-Time Upload & Slide-by-Slide Syllabus */}
          <aside
            style={{
              width: isSidebarCollapsed ? 0 : `${sidebarWidth}px`,
              minWidth: isSidebarCollapsed ? 0 : `${sidebarWidth}px`,
              maxWidth: isSidebarCollapsed ? 0 : `${sidebarWidth}px`,
              display: isSidebarCollapsed ? "none" : "flex",
            }}
            className={`fixed inset-y-0 left-0 z-40 h-full shrink-0 flex-col border-r border-slate-800 bg-[#0a0f1d] text-slate-300 md:static md:translate-x-0 ${
              isSidebarOpen ? "translate-x-0 shadow-2xl flex" : "-translate-x-full md:flex"
            }`}
          >
            {/* Sidebar Width Control Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#080d19] border-b border-slate-800/80 text-[10px] text-slate-400 shrink-0">
              <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1 truncate">
                <Columns className="h-3 w-3 text-indigo-400 shrink-0" />
                <span>Syllabus ({sidebarWidth}px)</span>
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSidebarWidth(240)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium border transition ${
                    sidebarWidth === 240
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                  title="Narrow width (240px)"
                >
                  240px
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarWidth(300)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium border transition ${
                    sidebarWidth === 300
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                  title="Standard width (300px)"
                >
                  300px
                </button>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700 transition"
                  title="Hide navigation panel (Ctrl+B)"
                >
                  <PanelLeftClose className="h-3 w-3" />
                </button>
              </div>
            </div>
            {/* Document Switcher & Real-Time Upload */}
            <div className="p-3.5 border-b border-slate-800 bg-[#0c1222] space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,.docx,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />

              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Book / Slides:
                </label>
                <span className="text-[10px] font-semibold text-indigo-400">
                  {documents.length} Available
                </span>
              </div>

              {/* Document Dropdown with Quick Delete Action */}
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  disabled={isUploading}
                  className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none transition truncate"
                >
                  {documents.length === 0 ? (
                    <option value="">No books uploaded yet — upload below</option>
                  ) : (
                    documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.page_count} pages)
                      </option>
                    ))
                  )}
                </select>

                {selectedDocId && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedDoc}
                    className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-950/30 transition shrink-0"
                    title="Delete this document and purge all its vector chunks"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Real-time File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-500/50 bg-indigo-950/30 hover:bg-indigo-900/40 p-2 text-xs font-semibold text-indigo-300 transition shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    <span className="truncate">{uploadProgressText || "Indexing in real time..."}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 text-indigo-400" />
                    <span>+ Upload Book / Slides in Real Time</span>
                  </>
                )}
              </button>

              {/* Jump directly to Slide # Input */}
              {syllabus && (
                <form onSubmit={handleJumpToSlide} className="flex items-center gap-1.5 pt-1">
                  <input
                    type="number"
                    min={1}
                    max={syllabus.total_pages}
                    value={jumpSlideInput}
                    onChange={(e) => setJumpSlideInput(e.target.value)}
                    placeholder={`Jump to Slide # (1–${syllabus.total_pages})...`}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!jumpSlideInput}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                  >
                    Go
                  </button>
                </form>
              )}

              {/* View Mode Switcher Tabs: Individual Slides vs Concept Batches */}
              <div className="flex rounded-lg border border-slate-800 bg-slate-900/80 p-0.5 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNavMode("slides");
                    if (syllabus && activeLesson && activeLesson.start_page !== activeLesson.end_page) {
                      loadSingleSlide(activeLesson.start_page, syllabus);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-md transition ${
                    navMode === "slides"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                  <span>Individual Slides</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNavMode("lessons");
                    if (syllabus?.lessons && syllabus.lessons.length > 0) {
                      const curPage = activeLesson?.start_page || 1;
                      const enclosingBatch =
                        syllabus.lessons.find((l) => l.start_page <= curPage && l.end_page >= curPage) ||
                        syllabus.lessons[0];
                      if (
                        enclosingBatch &&
                        (activeLesson?.start_page !== enclosingBatch.start_page ||
                          activeLesson?.end_page !== enclosingBatch.end_page)
                      ) {
                        loadLesson(enclosingBatch, syllabus.document_id);
                      }
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-md transition ${
                    navMode === "lessons"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Concept Batches</span>
                </button>
              </div>
            </div>

            {/* Individual Slides List View */}
            {navMode === "slides" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {/* Search / Filter Slide Title */}
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={slideSearchTerm}
                    onChange={(e) => setSlideSearchTerm(e.target.value)}
                    placeholder="Filter slides by title or keyword..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-8 pr-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between px-1 py-0.5 mb-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>Slide Number & Title</span>
                  <span>{filteredSlides.length} Slides</span>
                </div>

                {isLoadingSyllabus && (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-400" />
                    <p>Fetching individual slides...</p>
                  </div>
                )}

                {filteredSlides.map((slide) => {
                  const isSelected = activeLesson?.start_page === slide.page_number && activeLesson?.end_page === slide.page_number;
                  return (
                    <button
                      key={slide.page_number}
                      onClick={() => loadSingleSlide(slide.page_number)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                        isSelected
                          ? "border border-indigo-500/60 bg-indigo-600/25 text-white font-semibold shadow-sm"
                          : "border border-transparent bg-slate-900/40 hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-mono font-bold ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {slide.page_number}
                      </span>
                      <span className="text-xs truncate flex-1">
                        {slide.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Concept Batches View */}
            {navMode === "lessons" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Lesson Batches
                  </span>
                  {syllabus && (
                    <span className="rounded bg-indigo-950 border border-indigo-800/40 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                      {syllabus.total_lessons} Lessons
                    </span>
                  )}
                </div>

                {isLoadingSyllabus && (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-400" />
                    <p>Clustering slides into lesson batches...</p>
                  </div>
                )}

                {syllabus?.lessons?.map((lesson) => {
                  const isSelected =
                    activeLesson?.start_page === lesson.start_page && activeLesson?.end_page === lesson.end_page;
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
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* DRAGGABLE RESIZER SPLITTER (Drag to adjust content vs navigation ratio) */}
          {!isSidebarCollapsed && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                isResizingRef.current = true;
                document.body.style.cursor = "col-resize";
                document.body.style.userSelect = "none";
              }}
              className="hidden md:flex w-2.5 hover:w-3 cursor-col-resize items-center justify-center bg-[#070b13] hover:bg-indigo-600/30 border-x border-slate-800/80 transition-all group z-30 select-none shrink-0"
              title="Drag left/right to resize syllabus panel"
            >
              <div className="w-0.5 h-10 bg-slate-700 group-hover:bg-indigo-400 rounded-full transition-colors" />
            </div>
          )}

          {/* RIGHT PANE: The Masterclass Lecture Hall */}
          <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#070b13] relative">
            {/* Floating button to restore syllabus if collapsed */}
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="hidden md:flex absolute top-3 left-4 z-30 items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-[#0d1527]/95 px-3 py-1.5 text-xs font-semibold text-indigo-300 shadow-xl backdrop-blur-md hover:bg-indigo-900/80 transition"
                title="Show Syllabus & Batches (Ctrl+B)"
              >
                <PanelLeftOpen className="h-4 w-4 text-indigo-400" />
                <span>Show Syllabus</span>
              </button>
            )}

            {activeLesson && (
              <div className="border-b border-slate-800 bg-[#090e1a] px-4 py-3 sm:px-8 flex items-center justify-between gap-3 flex-wrap shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                      {activeLesson.start_page === activeLesson.end_page
                        ? `Slide ${activeLesson.start_page} of ${syllabus?.total_pages}`
                        : `Slides ${activeLesson.start_page}–${activeLesson.end_page}`}
                    </span>
                    <span className="text-xs font-medium text-slate-400 truncate max-w-xs">
                      {syllabus?.document_title}
                    </span>
                  </div>
                  <h1 className="mt-1 text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
                    {activeLesson.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  {/* Car & Commute Voice Lecture Toggle Button */}
                  <button
                    onClick={() => {
                      setIsVoiceHUDOpen((prev) => !prev);
                      if (!isPlayingVoice) {
                        toggleLectureAudio();
                      }
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                      isPlayingVoice
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse"
                        : "border border-indigo-500/40 bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-300"
                    }`}
                    title="Listen hands-free in car or while multi-tasking"
                  >
                    <Headphones className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{isPlayingVoice ? "Playing Voice Lecture" : "🎧 Car & Voice Lecture"}</span>
                  </button>

                  {/* Retry Button if failed */}
                  {errorMsg && (
                    <button
                      onClick={() => syllabus && loadLesson(activeLesson, syllabus.document_id)}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600/30 border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-600 hover:text-white transition"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry Deep Lecture</span>
                    </button>
                  )}

                  {/* Toggle Raw Slide Bullets */}
                  <button
                    onClick={() => setIsRawSlidesOpen(!isRawSlidesOpen)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                  >
                    <FileText className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{isRawSlidesOpen ? "Hide Slide Text" : "View Slide Text"}</span>
                    {isRawSlidesOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* CAR & COMMUTE VOICE LECTURE HUD (Autonomous Audio Stream & Interjection) */}
            {isVoiceHUDOpen && activeLesson && (
              <div className="border-b border-indigo-500/30 bg-gradient-to-r from-[#0b1329] via-[#0e172e] to-[#0b1329] p-3 sm:px-8 py-3.5 shadow-xl shrink-0 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleLectureAudio}
                      disabled={isSynthesizingVoice}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 transition active:scale-95 disabled:opacity-50"
                      title={isPlayingVoice ? "Pause Lecture" : "Play Lecture"}
                    >
                      {isSynthesizingVoice ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isPlayingVoice ? (
                        <Pause className="h-5 w-5 fill-current" />
                      ) : (
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                          <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                          <span>CAR & COMMUTE STREAM</span>
                        </span>
                        <span className="text-[11px] font-medium text-slate-300">
                          {formatAudioTime(audioProgress)} / {formatAudioTime(audioDuration)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate max-w-sm mt-0.5">
                        {activeLesson.title}
                      </p>
                    </div>
                  </div>

                  {/* Voice Controls: Speed + Voice Persona + Conversational Toggle */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Voice Persona Dropdown */}
                    <select
                      value={selectedVoice}
                      onChange={(e) => {
                        setSelectedVoice(e.target.value);
                        if (isPlayingVoice) {
                          audioRef.current?.pause();
                          setIsPlayingVoice(false);
                        }
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="en-GB-RyanNeural">Prof. Sterling (British Scholar)</option>
                      <option value="en-KE-ChilembaNeural">Prof. Omondi (UoN Chiromo Voice)</option>
                      <option value="en-US-ChristopherNeural">Prof. Miller (Deep American)</option>
                      <option value="en-GB-SoniaNeural">Prof. Catherine (Distinguished)</option>
                    </select>

                    {/* Conversational Lecture Toggle */}
                    <button
                      onClick={() => setIsConversationalOral(!isConversationalOral)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                        isConversationalOral
                          ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/40"
                          : "bg-slate-900 text-slate-400 border-slate-700"
                      }`}
                      title="Transform slides into a spoken oral lecture rather than reading notes"
                    >
                      {isConversationalOral ? "🗣️ Oral Masterclass" : "📄 Direct Notes"}
                    </button>

                    {/* Speed selector */}
                    <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-[10px]">
                      {[1.0, 1.25, 1.5].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => handleSpeedChange(spd)}
                          className={`px-2 py-1 rounded font-bold transition ${
                            playbackSpeed === spd
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>

                    {/* Hands-Free Voice Interjection Mic */}
                    <button
                      onClick={handleToggleVoiceMic}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-md ${
                        isListeningMic
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                      title="Tap to speak and interject with a question"
                    >
                      {isListeningMic ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      <span>{isListeningMic ? "Listening to You..." : "🎙️ Speak to Interject"}</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar scrub */}
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={audioDuration || 100}
                    value={audioProgress || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setAudioProgress(val);
                      if (audioRef.current) audioRef.current.currentTime = val;
                    }}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-800 accent-indigo-500"
                  />
                </div>

                {/* Real-time speech transcript feedback banner */}
                {(isListeningMic || isVoiceAnswering || voiceTranscript) && (
                  <div className="flex items-center gap-2 rounded-lg bg-indigo-950/80 border border-indigo-500/30 px-3 py-1.5 text-xs text-indigo-200 animate-in fade-in">
                    {isVoiceAnswering ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                    <span className="font-semibold text-white">
                      {isVoiceAnswering
                        ? "Professor is formulating your spoken answer..."
                        : `You: "${voiceTranscript || "Speak your question now..."}"`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Lecture Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
              
              {/* INSTANT Raw Slide Text (Always visible instantly - never blank!) */}
              {rawSlidesPreview && isRawSlidesOpen && (
                <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 p-4 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        ⚡ Instant Slide Notes
                      </span>
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        {activeLesson?.start_page === activeLesson?.end_page
                          ? `Slide ${activeLesson?.start_page} Raw Text`
                          : `Slides ${activeLesson?.start_page}–${activeLesson?.end_page} Raw Text`}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      Page {activeLesson?.start_page} of {syllabus?.total_pages}
                    </span>
                  </div>
                  <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap text-[11px] sm:text-xs font-mono text-slate-200 p-3.5 rounded-lg bg-black/80 border border-slate-800 leading-relaxed shadow-inner">
                    {rawSlidesPreview}
                  </pre>
                  <p className="mt-2 text-[10px] text-slate-400 italic flex items-center gap-1.5">
                    <span>💡</span>
                    <span>The Professor's deep masterclass deconstructing these points in full theoretical depth is delivered below.</span>
                  </p>
                </div>
              )}

              {/* Loading Masterclass State */}
              {isLoadingLecture && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/15 p-8 text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-400" />
                  <p className="text-sm font-semibold text-white">
                    Professor is delivering Deep Masterclass on{" "}
                    {activeLesson?.start_page === activeLesson?.end_page
                      ? `Slide ${activeLesson?.start_page}`
                      : `Slides ${activeLesson?.start_page}–${activeLesson?.end_page}`}...
                  </p>
                  <p className="text-xs font-medium text-indigo-300 animate-pulse">
                    {lectureLoadingStage}
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Unpacking theoretical mechanics, memory maps, C code, and Chiromo Section B exam calculations with GPT-4.1.
                  </p>
                </div>
              )}

              {/* Error Alert with One-Click Retry */}
              {errorMsg && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                  <button
                    onClick={() => syllabus && activeLesson && loadLesson(activeLesson, syllabus.document_id)}
                    className="rounded bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-500 transition"
                  >
                    Retry Now
                  </button>
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
                        Interactive Professor Office Hours (Live Doubts for this Slide)
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
                            ? activeLesson.start_page === activeLesson.end_page
                              ? `Ask the Professor anything regarding Slide ${activeLesson.start_page}...`
                              : `Ask the Professor anything regarding Lesson Batch (Slides ${activeLesson.start_page}–${activeLesson.end_page})...`
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

            {/* Footer Stepper: Individual Slides vs Concept Batches */}
            {syllabus && activeLesson && (
              <footer className="h-16 border-t border-slate-800 bg-[#0c1222] px-4 sm:px-8 flex items-center justify-between shrink-0">
                {navMode === "lessons" ? (
                  // BATCH LESSON STEPPER
                  (() => {
                    const lessons = syllabus.lessons || [];
                    const currentIdx = lessons.findIndex(
                      (l) => l.start_page === activeLesson.start_page && l.end_page === activeLesson.end_page
                    );
                    const effectiveIdx =
                      currentIdx !== -1
                        ? currentIdx
                        : lessons.findIndex(
                            (l) => l.start_page <= activeLesson.start_page && l.end_page >= activeLesson.start_page
                          );

                    const hasPrev = effectiveIdx > 0;
                    const hasNext = effectiveIdx !== -1 && effectiveIdx < lessons.length - 1;
                    const prevLesson = hasPrev ? lessons[effectiveIdx - 1] : null;
                    const nextLesson = hasNext ? lessons[effectiveIdx + 1] : null;
                    const curLesson = effectiveIdx !== -1 ? lessons[effectiveIdx] : null;

                    return (
                      <>
                        <button
                          onClick={() => {
                            if (prevLesson) {
                              loadLesson(prevLesson, syllabus.document_id);
                            }
                          }}
                          disabled={!hasPrev || isLoadingLecture}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition"
                          title={prevLesson ? `Previous: Lesson ${prevLesson.lesson_id}` : undefined}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>
                            {prevLesson
                              ? `Prev: Lesson ${prevLesson.lesson_id} (Slides ${prevLesson.start_page}–${prevLesson.end_page})`
                              : "First Batch"}
                          </span>
                        </button>

                        <div className="text-xs text-slate-400 font-medium hidden sm:flex items-center gap-2">
                          <span className="font-semibold text-indigo-400">
                            {curLesson ? `Lesson ${curLesson.lesson_id} of ${syllabus.total_lessons}` : "Concept Batch"}
                          </span>
                          <span>•</span>
                          <span>
                            Slides {activeLesson.start_page}–{activeLesson.end_page}
                          </span>
                          <span>•</span>
                          <span className="text-slate-300 font-semibold truncate max-w-xs">{activeLesson.title}</span>
                        </div>

                        <button
                          onClick={() => {
                            if (nextLesson) {
                              loadLesson(nextLesson, syllabus.document_id);
                            }
                          }}
                          disabled={!hasNext || isLoadingLecture}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-40 transition"
                          title={nextLesson ? `Next: Lesson ${nextLesson.lesson_id}` : undefined}
                        >
                          <span>
                            {nextLesson
                              ? `Next: Lesson ${nextLesson.lesson_id} (Slides ${nextLesson.start_page}–${nextLesson.end_page}) →`
                              : "Completed All Lessons"}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    );
                  })()
                ) : (
                  // INDIVIDUAL SLIDE STEPPER
                  <>
                    <button
                      onClick={() => {
                        const prevPage = activeLesson.start_page - 1;
                        if (prevPage >= 1) {
                          loadSingleSlide(prevPage);
                        }
                      }}
                      disabled={activeLesson.start_page <= 1 || isLoadingLecture}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous Slide</span>
                    </button>

                    <div className="text-xs text-slate-400 font-medium hidden sm:flex items-center gap-2">
                      <span>
                        Slide {activeLesson.start_page} of {syllabus.total_pages}
                      </span>
                      <span>•</span>
                      <span className="text-indigo-400 truncate max-w-xs">{activeLesson.title}</span>
                    </div>

                    <button
                      onClick={() => {
                        const nextPage = activeLesson.end_page + 1;
                        if (nextPage <= syllabus.total_pages) {
                          loadSingleSlide(nextPage);
                        }
                      }}
                      disabled={activeLesson.end_page >= syllabus.total_pages || isLoadingLecture}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-40 transition"
                    >
                      <span>
                        {activeLesson.end_page < syllabus.total_pages
                          ? `Next: Slide ${activeLesson.end_page + 1} →`
                          : "Completed Entire Document"}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </footer>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
