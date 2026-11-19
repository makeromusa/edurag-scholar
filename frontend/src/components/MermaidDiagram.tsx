"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, Copy, Check, AlertTriangle, Eye, Code } from "lucide-react";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
  title?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  chart,
  className = "",
  title = "Technical Diagram",
}) => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "code">("visual");

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      if (!chart.trim()) return;
      try {
        setError(null);
        // Dynamic import to avoid SSR window issues
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            darkMode: true,
            background: "#0c111d",
            primaryColor: "#2563eb",
            primaryTextColor: "#ffffff",
            primaryBorderColor: "#3b82f6",
            lineColor: "#60a5fa",
            secondaryColor: "#1e293b",
            tertiaryColor: "#0f172a",
            edgeLabelBackground: "#090d16",
          },
          securityLevel: "loose",
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to render diagram syntax");
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "_")}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!svgContent) return;
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * 2 || 1200;
      canvas.height = img.height * 2 || 800;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0c111d";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${title.toLowerCase().replace(/\s+/g, "_")}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className={`rounded-xl border border-slate-800 bg-[#0c111d] overflow-hidden my-3 shadow-sm ${className}`}>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#090d16] px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold text-slate-200">{title}</span>
          <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 text-[10px] font-mono text-blue-400">
            Mermaid Vector
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "visual" ? "code" : "visual")}
            className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 transition"
            title="Toggle between Diagram and Mermaid Source Code"
          >
            {viewMode === "visual" ? <Code className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{viewMode === "visual" ? "Source" : "Visual"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 transition"
            title="Copy Mermaid code"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            disabled={!svgContent}
            className="flex items-center gap-1 rounded-md border border-slate-700 bg-blue-600/20 px-2 py-1 text-[11px] font-medium text-blue-300 hover:bg-blue-600 hover:text-white transition disabled:opacity-40"
            title="Download crisp Vector SVG"
          >
            <Download className="h-3 w-3" />
            <span>SVG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={!svgContent}
            className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-40"
            title="Download high-res PNG"
          >
            <Download className="h-3 w-3" />
            <span>PNG</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 overflow-x-auto min-h-[160px] flex items-center justify-center bg-[#0a0f1d]">
        {viewMode === "code" ? (
          <pre className="w-full text-xs font-mono text-slate-300 bg-[#090d16] p-3 rounded-lg border border-slate-800/80 overflow-x-auto">
            {chart}
          </pre>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-center text-slate-400 py-6">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <p className="text-xs text-amber-300 font-medium">Diagram Syntax Note</p>
            <p className="text-[11px] text-slate-500 max-w-sm">{error}</p>
            <button
              onClick={() => setViewMode("code")}
              className="text-xs text-blue-400 underline mt-1"
            >
              View Diagram Source Code
            </button>
          </div>
        ) : svgContent ? (
          <div
            className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="text-xs text-slate-500 animate-pulse">Rendering technical diagram...</div>
        )}
      </div>
    </div>
  );
};