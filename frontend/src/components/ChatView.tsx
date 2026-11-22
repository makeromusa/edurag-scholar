"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Globe,
  Sparkles,
  BookOpen,
  User,
  Bot,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  GraduationCap,
  Lock,
  LogIn,
} from "lucide-react";
import { AcademicMarkdown } from "./AcademicMarkdown";
import { ActiveCitation } from "./DocumentViewer";
import { useAuth } from "@/lib/AuthContext";

interface AttachedFileMeta {
  name: string;
  type: "image" | "document";
  previewUrl?: string;
  size?: string;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  citations?: ActiveCitation[];
  external_sources?: { type: string; title: string; url: string }[];
  web_search_used?: boolean;
  attachedFile?: AttachedFileMeta;
}

interface PendingAttachment {
  file: File;
  name: string;
  type: "image" | "document";
  base64: string;
  previewUrl?: string;
  sizeFormatted: string;
}

interface ChatViewProps {
  unitCode: string;
  unitName: string;
  onSelectCitation: (citation: ActiveCitation) => void;
  onOpenProfessorMode?: (topic?: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  unitCode,
  unitName,
  onSelectCitation,
  onOpenProfessorMode,
}) => {
  const { session, user, profile, openAuthModal } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [deepSearch, setDeepSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Dynamically address the signed-in student
    const studentName =
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "Scholar";

    setMessages([
      {
        id: "welcome",
        sender: "assistant",
        content: `👋 Hello ${studentName}! I am your AI Copilot strictly isolated to **${unitCode}: ${unitName}**.

You can ask me questions, attach past papers (PDF), or upload screenshots/diagrams of exam questions. I will solve them with step-by-step proofs and cite exact lecture slide numbers.`,
      },
    ]);
    setPendingAttachment(null);
  }, [unitCode, unitName, user?.id, profile?.full_name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const processFile = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      alert("File is too large. Please select a file under 25MB.");
      return;
    }
    const isImage =
      file.type.startsWith("image/") ||
      /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result as string;
      setPendingAttachment({
        file,
        name: file.name,
        type: isImage ? "image" : "document",
        base64: base64Str,
        previewUrl: isImage ? base64Str : undefined,
        sizeFormatted: formatFileSize(file.size),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          break;
        }
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    const query = (customQuery || inputQuery).trim();
    if ((!query && !pendingAttachment) || isLoading) return;

    const effectiveQuery =
      query ||
      (pendingAttachment?.type === "image"
        ? `Please carefully analyze this attached image/diagram and solve or explain it step-by-step for ${unitCode}.`
        : `Please examine this attached document for ${unitCode} and provide a comprehensive academic analysis.`);

    const attached = pendingAttachment ? { ...pendingAttachment } : null;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: effectiveQuery,
      attachedFile: attached
        ? {
            name: attached.name,
            type: attached.type,
            previewUrl: attached.previewUrl,
            size: attached.sizeFormatted,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setPendingAttachment(null);
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          unit_code: unitCode,
          query: effectiveQuery,
          deep_search: deepSearch,
          image_base64: attached?.type === "image" ? attached.base64 : undefined,
          attached_file_base64: attached?.base64,
          attached_file_name: attached?.name,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || `Server responded with HTTP ${res.status}`);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        content: data.answer || "No response received.",
        citations: data.citations || [],
        external_sources: data.external_sources || [],
        web_search_used: data.web_search_used,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          content: `⚠️ Error contacting EduRAG Backend: ${err.message}. Make sure the FastAPI backend is running.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#f8fafc] text-slate-800">
      {/* Unit Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[#1a2c4e]">{unitCode}</h2>
            <span className="rounded-md bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              Unit Isolated
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">{unitName}</p>
        </div>

        {/* Deep Web Search Autonomous Toggle */}
        <button
          onClick={() => setDeepSearch(!deepSearch)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            deepSearch
              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs"
              : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
          title="Force academic web fallback"
        >
          <Globe className={`h-3.5 w-3.5 ${deepSearch ? "text-blue-600 animate-spin" : "text-slate-400"}`} />
          <span>Deep Web Search {deepSearch ? "(ON)" : "(Auto)"}</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs sm:text-sm leading-relaxed ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Bot className="h-4.5 w-4.5" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl px-4 py-3.5 shadow-xs ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-xs"
                  : "bg-white border border-slate-200 text-[#1a2c4e] rounded-bl-xs"
              }`}
            >
              {/* Attached File/Image in message */}
              {msg.attachedFile && (
                <div className="mb-2.5">
                  {msg.attachedFile.type === "image" && msg.attachedFile.previewUrl ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200 max-w-sm">
                      <img
                        src={msg.attachedFile.previewUrl}
                        alt={msg.attachedFile.name}
                        className="max-h-56 w-auto object-contain rounded-lg bg-slate-100"
                      />
                      <div className="text-[11px] bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 text-slate-200 truncate">
                        📷 {msg.attachedFile.name} ({msg.attachedFile.size})
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs text-blue-900 max-w-xs">
                      <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                      <div className="truncate">
                        <p className="font-semibold truncate">{msg.attachedFile.name}</p>
                        <span className="text-[10px] text-blue-600">{msg.attachedFile.size}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="w-full">
                <AcademicMarkdown content={msg.content} />
              </div>

              {/* Citations Badges */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 border-t border-slate-200/80 pt-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Lecturer Slide Citations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectCitation(c)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 text-xs font-semibold text-blue-700 transition"
                      >
                        <BookOpen className="h-3 w-3 text-blue-600" />
                        <span>Slide {c.page_number}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Web Sources Badges */}
              {msg.external_sources && msg.external_sources.length > 0 && (
                <div className="mt-2.5 border-t border-slate-200/80 pt-2">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                    External Academic Sources:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.external_sources.map((ext, i) => (
                      <a
                        key={i}
                        href={ext.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition"
                      >
                        <Globe className="h-3 w-3 text-emerald-600" />
                        <span className="truncate max-w-[160px]">{ext.title || ext.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 font-bold">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 text-xs sm:text-sm justify-start items-center text-slate-500">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white animate-pulse">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="animate-pulse">
              Synthesizing response from {unitCode} lecture notes & verified materials...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Fast Prompts */}
      <div className="flex gap-2 px-4 sm:px-6 py-2.5 overflow-x-auto border-t border-slate-200 bg-white">
        {onOpenProfessorMode && (
          <button
            onClick={() => onOpenProfessorMode(inputQuery.trim() || undefined)}
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 transition shadow-2xs"
            title="Have an elite Professor teach this concept step-by-step"
          >
            <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
            <span>👨‍🏫 Professor Teaching Mode</span>
          </button>
        )}
        {[
          "Solve this past paper question step-by-step",
          "Explain the formula or diagram in detail",
          "What are the common exam pitfalls for this topic?",
        ].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (!user) {
                openAuthModal();
                return;
              }
              handleSendMessage(undefined, prompt);
            }}
            className="shrink-0 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 hover:text-blue-600 px-3.5 py-1.5 text-xs text-slate-600 transition font-medium"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Attachment Preview Banner */}
      {pendingAttachment && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-100 px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {pendingAttachment.type === "image" && pendingAttachment.previewUrl ? (
              <img
                src={pendingAttachment.previewUrl}
                alt="Attachment Preview"
                className="h-10 w-10 rounded-lg object-cover border border-slate-300 shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 border border-blue-200 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-semibold text-[#1a2c4e] max-w-[220px] sm:max-w-md">
                  {pendingAttachment.name}
                </span>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">
                  {pendingAttachment.sizeFormatted}
                </span>
              </div>
              <p className="text-[11px] text-blue-600 font-medium">
                {pendingAttachment.type === "image"
                  ? "Vision-ready: Visual formula, graph & diagram inspection enabled"
                  : "Document context: Will be extracted and analyzed with lecture notes"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPendingAttachment(null)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            title="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input Box */}
      <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
        {!user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-50/70 p-3 sm:px-4">
            <div className="flex items-center gap-2 text-xs text-blue-950 font-medium">
              <Lock className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                <strong>Scholar Sign In Required:</strong> Log in with your student account to ask AI questions and solve past papers.
              </span>
            </div>
            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-xs shrink-0 cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In to Chat</span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => handleSendMessage(e)}
            onPaste={handlePaste}
          >
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.docx,.doc,.md,.py,.c,.cpp,.java,.sql"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 shadow-2xs transition">
              {/* Attach Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-blue-600 transition"
                title="Attach past paper PDF, question screenshot, or diagram (or Ctrl+V to paste)"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  pendingAttachment
                    ? `Ask a question about ${pendingAttachment.name} (or hit Enter to analyze)...`
                    : `Ask about ${unitCode} slides, past papers, or attach an exam question...`
                }
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#1a2c4e] placeholder-slate-400 focus:outline-none"
              />

              <button
                type="submit"
                disabled={(!inputQuery.trim() && !pendingAttachment) || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition shadow-md shadow-blue-500/20"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
