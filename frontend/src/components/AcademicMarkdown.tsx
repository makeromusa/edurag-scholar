"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { MermaidDiagram } from "./MermaidDiagram";
import { normalizeMathAndMarkdown } from "@/lib/mathFormatter";

interface AcademicMarkdownProps {
  content: string;
  className?: string;
}

export const AcademicMarkdown: React.FC<AcademicMarkdownProps> = ({
  content,
  className = "",
}) => {
  const normalized = normalizeMathAndMarkdown(content);

  const components = {
    h1: ({ children, ...props }: any) => (
      <h1
        className="text-base sm:text-lg font-black text-sky-400 border-b border-sky-500/20 pb-1.5 mt-5 mb-2.5 flex items-center gap-2 tracking-tight"
        {...props}
      >
        <span className="h-2 w-2 rounded-full bg-sky-400 inline-block shrink-0 shadow-xs shadow-sky-400/50" />
        <span>{children}</span>
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2
        className="text-sm sm:text-base font-extrabold text-amber-300 mt-4 mb-2 flex items-center gap-1.5 tracking-tight"
        {...props}
      >
        <span className="text-amber-400 text-xs font-mono font-bold">▸</span>
        <span>{children}</span>
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3
        className="text-xs sm:text-sm font-bold text-violet-300 mt-3.5 mb-1.5 flex items-center gap-1.5"
        {...props}
      >
        <span className="h-1.5 w-1.5 rounded-xs bg-violet-400 inline-block shrink-0" />
        <span>{children}</span>
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-xs font-bold text-emerald-400 mt-3 mb-1" {...props}>
        {children}
      </h4>
    ),
    p: ({ children, ...props }: any) => (
      <p className="text-xs leading-relaxed text-slate-200 my-2 font-normal" {...props}>
        {children}
      </p>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-bold text-sky-200" {...props}>
        {children}
      </strong>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="my-2.5 space-y-1.5 pl-4 list-disc text-xs text-slate-300 marker:text-blue-400" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="my-2.5 space-y-1.5 pl-4 list-decimal text-xs text-slate-300 marker:text-amber-400 font-medium" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="text-xs leading-relaxed text-slate-200" {...props}>
        {children}
      </li>
    ),
    table: ({ children, ...props }: any) => (
      <div className="my-3.5 overflow-x-auto rounded-xl border border-slate-700/80 bg-[#080d1a] shadow-lg">
        <table className="w-full text-left text-xs border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead
        className="bg-slate-900/90 text-sky-300 font-bold border-b border-slate-700 uppercase tracking-wider text-[10px]"
        {...props}
      >
        {children}
      </thead>
    ),
    th: ({ children, ...props }: any) => (
      <th className="px-3.5 py-2.5 font-bold text-sky-300 border-b border-slate-700" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="px-3.5 py-2.5 border-b border-slate-800/60 text-slate-200 text-xs" {...props}>
        {children}
      </td>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote
        className="border-l-4 border-amber-500 bg-amber-950/25 px-3.5 py-2.5 rounded-r-xl my-3 text-xs italic text-amber-200 shadow-xs"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      const lang = match ? match[1] : "";
      const codeString = String(children).replace(/\n$/, "");

      if (
        !inline &&
        (lang === "mermaid" ||
          codeString.trim().startsWith("flowchart") ||
          codeString.trim().startsWith("graph") ||
          codeString.trim().startsWith("sequenceDiagram"))
      ) {
        return (
          <div className="my-3.5">
            <MermaidDiagram chart={codeString} title="Technical Architecture & Flow Diagram" />
          </div>
        );
      }

      return !inline ? (
        <div className="relative group my-2.5">
          <pre className="overflow-x-auto rounded-xl bg-slate-950/90 p-3 text-xs font-mono text-slate-200 border border-slate-800 shadow-md">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      ) : (
        <code className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[11px] font-mono text-amber-300 border border-slate-700/50" {...props}>
          {children}
        </code>
      );
    },
    // Math display container override for maximum readability and zero overflow
    div: ({ className, children, ...props }: any) => {
      if (className?.includes("math-display") || className?.includes("katex-display")) {
        return (
          <div
            className="my-3 overflow-x-auto py-2.5 px-3.5 rounded-xl bg-slate-900/80 border border-blue-500/25 text-amber-200 shadow-sm text-center"
            {...props}
          >
            {children}
          </div>
        );
      }
      return <div className={className} {...props}>{children}</div>;
    },
    span: ({ className, children, ...props }: any) => {
      return <span className={className} {...props}>{children}</span>;
    },
  };

  return (
    <div className={`prose prose-invert max-w-none text-xs ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
};
