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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ActiveCitation } from "./DocumentViewer";

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
}

export const ChatView: React.FC<ChatViewProps> = ({
  unitCode,
  unitName,
  onSelectCitation,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [deepSearch, setDeepSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset or greet on unit change
    setMessages([
      {
        id: "welcome",
        sender: "assistant",
        content: `👋 Hello Asman! I am your AI Copilot strictly isolated to **${unitCode}: ${unitName}**.

You can ask me questions, attach past papers (PDF), or upload screenshots/diagrams of exam questions. I will solve them with step-by-step proofs and cite exact lecture slide numbers.`,
      },
    ]);
    setPendingAttachment(null);
  }, [unitCode, unitName]);

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_code: unitCode,
          query: effectiveQuery,
          deep_search: deepSearch,
          image_base64: attached?.type === "image" ? attached.base64 : undefined,
          attached_file_base64: attached?.base64,
          attached_file_name: attached?.name,
        }),
      });

      const data = await res.json();
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
    <div className="flex h-full flex-col bg-[#080c15] text-slate-200">
      {/* Unit Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0c111d]/80 px-6 py-3.5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">{unitCode}</h2>
            <span className="rounded bg-blue-600/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
              Unit Isolated
            </span>
          </div>
          <p className="text-xs text-slate-400">{unitName}</p>
        </div>

        {/* Deep Web Search Autonomous Toggle */}
        <button
          onClick={() => setDeepSearch(!deepSearch)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            deepSearch
              ? "border-blue-500 bg-blue-600/20 text-blue-400 shadow-sm shadow-blue-500/20"
              : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
          }`}
          title="Force academic web fallback via Tavily"
        >
          <Globe className={`h-3.5 w-3.5 ${deepSearch ? "text-blue-400 animate-spin" : ""}`} />
          <span>Deep Web Search {deepSearch ? "(ON)" : "(Auto)"}</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs leading-relaxed ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-[#0f172a] border border-slate-800 text-slate-200 rounded-bl-none"
              }`}
            >
              {/* Attached File/Image in message */}
              {msg.attachedFile && (
                <div className="mb-2">
                  {msg.attachedFile.type === "image" && msg.attachedFile.previewUrl ? (
                    <div className="overflow-hidden rounded-lg border border-white/20 max-w-sm">
                      <img
                        src={msg.attachedFile.previewUrl}
                        alt={msg.attachedFile.name}
                        className="max-h-56 w-auto object-contain rounded-lg bg-black/40"
                      />
                      <div className="text-[10px] bg-black/70 backdrop-blur-sm px-2 py-1 text-slate-200 truncate">
                        📷 {msg.attachedFile.name} ({msg.attachedFile.size})
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-blue-700/60 border border-blue-400/30 px-3 py-1.5 text-[11px] text-white max-w-xs">
                      <FileText className="h-4 w-4 shrink-0 text-blue-200" />
                      <div className="truncate">
                        <p className="font-semibold truncate">{msg.attachedFile.name}</p>
                        <span className="text-[9px] text-blue-200">{msg.attachedFile.size}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="prose prose-invert max-w-none text-xs">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {msg.content}
                </ReactMarkdown>
              </div>

              {/* Citations Badges */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 border-t border-slate-800/80 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Lecturer Slide Citations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectCitation(c)}
                        className="flex items-center gap-1 rounded bg-slate-800/90 hover:bg-blue-600/30 border border-slate-700/80 hover:border-blue-500/50 px-2 py-0.5 text-[10px] font-medium text-blue-300 transition"
                      >
                        <BookOpen className="h-3 w-3 text-blue-400" />
                        <span>Slide {c.page_number}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Web Sources Badges */}
              {msg.external_sources && msg.external_sources.length > 0 && (
                <div className="mt-2 border-t border-slate-800/80 pt-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    External Academic Sources (Tavily):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.external_sources.map((ext, i) => (
                      <a
                        key={i}
                        href={ext.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-800/40 px-2 py-0.5 text-[10px] font-medium text-emerald-300 transition"
                      >
                        <Globe className="h-3 w-3 text-emerald-400" />
                        <span className="truncate max-w-[140px]">{ext.title || ext.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-200">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 text-xs justify-start items-center text-slate-400">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white animate-pulse">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="animate-pulse">
              Synthesizing response from {unitCode} lecture notes, attached files & academic sources...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Fast Prompts */}
      <div className="flex gap-2 px-6 py-2 overflow-x-auto border-t border-slate-800/60 bg-[#090d16]/50">
        {[
          "Solve this past paper question step-by-step",
          "Explain the formula or diagram in detail",
          "Summarize key definitions from the slides",
          "What are the common exam pitfalls for this topic?",
        ].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(undefined, prompt)}
            className="shrink-0 rounded-full border border-slate-800 bg-slate-900/80 hover:bg-slate-800 px-3 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Attachment Preview Banner */}
      {pendingAttachment && (
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#0a0f1d] px-6 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {pendingAttachment.type === "image" && pendingAttachment.previewUrl ? (
              <img
                src={pendingAttachment.previewUrl}
                alt="Attachment Preview"
                className="h-10 w-10 rounded-lg object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-semibold text-white max-w-[220px] sm:max-w-md">
                  {pendingAttachment.name}
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                  {pendingAttachment.sizeFormatted}
                </span>
              </div>
              <p className="text-[10px] text-blue-400">
                {pendingAttachment.type === "image"
                  ? "Vision-ready: GPT-4.1-mini & Gemini will inspect equations & diagrams"
                  : "Document context: Will be extracted and analyzed with lecture notes"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPendingAttachment(null)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => handleSendMessage(e)}
        className="border-t border-slate-800 bg-[#0c111d] p-4"
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

        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 focus-within:border-blue-500">
          {/* Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition"
            title="Attach past paper PDF, question screenshot, or diagram (or Ctrl+V to paste)"
          >
            <Paperclip className="h-4 w-4" />
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
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={(!inputQuery.trim() && !pendingAttachment) || isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition shadow-sm shadow-blue-500/20"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
