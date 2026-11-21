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
        className="text-base sm:text-lg font-black text-[#1a2c4e] border-b border-blue-200 pb-1.5 mt-5 mb-2.5 flex items-center gap-2 tracking-tight"
        {...props}
      >
        <span className="h-2 w-2 rounded-full bg-blue-600 inline-block shrink-0 shadow-xs shadow-blue-500/50" />
        <span>{children}</span>
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2
        className="text-sm sm:text-base font-extrabold text-blue-700 mt-4 mb-2 flex items-center gap-1.5 tracking-tight"
        {...props}
      >
        <span className="text-blue-600 text-xs font-mono font-bold">▸</span>
        <span>{children}</span>
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3
        className="text-xs sm:text-sm font-bold text-slate-700 mt-3.5 mb-1.5 flex items-center gap-1.5"
        {...props}
      >
        <span className="h-1.5 w-1.5 rounded-xs bg-slate-400 inline-block shrink-0" />
        <span>{children}</span>
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-xs sm:text-sm font-bold text-emerald-600 mt-3 mb-1" {...props}>
        {children}
      </h4>
    ),
    p: ({ children, ...props }: any) => (
      <p className="text-xs sm:text-sm leading-relaxed text-inherit my-2 font-normal" {...props}>
        {children}
      </p>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-bold text-[#1a2c4e]" {...props}>
        {children}
      </strong>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="my-2.5 space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-inherit marker:text-blue-600" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="my-2.5 space-y-1.5 pl-4 list-decimal text-xs sm:text-sm text-inherit marker:text-blue-600 font-medium" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="text-xs sm:text-sm leading-relaxed text-inherit" {...props}>
        {children}
      </li>
    ),
    table: ({ children, ...props }: any) => (
      <div className="my-3.5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead
        className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]"
        {...props}
      >
        {children}
      </thead>
    ),
    th: ({ children, ...props }: any) => (
      <th className="px-3.5 py-2.5 font-bold text-slate-700 border-b border-slate-200" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="px-3.5 py-2.5 border-b border-slate-100 text-slate-700 text-xs sm:text-sm" {...props}>
        {children}
      </td>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote
        className="border-l-4 border-blue-500 bg-blue-50 px-3.5 py-2.5 rounded-r-xl my-3 text-xs sm:text-sm italic text-blue-900 shadow-2xs"
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
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] sm:text-xs font-mono text-blue-700 border border-slate-200" {...props}>
          {children}
        </code>
      );
    },
    // Math display container override for maximum readability and zero overflow
    div: ({ className, children, ...props }: any) => {
      if (className?.includes("math-display") || className?.includes("katex-display")) {
        return (
          <div
            className="my-3 overflow-x-auto py-3 px-4 rounded-xl bg-white border border-blue-200 text-[#1a2c4e] shadow-xs text-center"
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
    <div className={`prose max-w-none text-xs sm:text-sm text-inherit ${className}`}>
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
