"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Globe, Sparkles, BookOpen, User, Bot, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ActiveCitation } from "./DocumentViewer";

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  citations?: ActiveCitation[];
  external_sources?: { type: string; title: string; url: string }[];
  web_search_used?: boolean;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset or greet on unit change
    setMessages([
      {
        id: "welcome",
        sender: "assistant",
        content: `👋 Hello Asman! I am your AI Copilot strictly isolated to **${unitCode}: ${unitName}**.

Ask me anything about your lecture slides, past exams, or algorithmic proofs. When I answer, I'll cite the exact slide numbers.`,
      },
    ]);
  }, [unitCode, unitName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = customQuery || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_code: unitCode,
          query: query,
          deep_search: deepSearch,
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
          content: `⚠️ Error contacting EduRAG Backend: ${err.message}. Make sure the FastAPI backend is running on port 8000.`,
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
            <span className="animate-pulse">Synthesizing answer from {unitCode} lecture notes & academic sources...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Fast Prompts */}
      <div className="flex gap-2 px-6 py-2 overflow-x-auto border-t border-slate-800/60 bg-[#090d16]/50">
        {[
          "Summarize key definitions from the slides",
          "Explain core formulas with LaTeX proofs",
          "Generate 3 Chiromo exam practice questions",
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

      {/* Input Box */}
      <form onSubmit={(e) => handleSendMessage(e)} className="border-t border-slate-800 bg-[#0c111d] p-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#090d16] px-4 py-2 focus-within:border-blue-500">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={`Ask anything about ${unitCode} slides, past papers, or algorithms...`}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
