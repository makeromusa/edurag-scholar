"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
  Lock,
  Terminal,
  Code2,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at?: string | null;
  api_key?: string | null;
}

const SUPER_ADMIN_EMAIL = "makeromusa17@gmail.com";

export default function AdminApiKeysPage() {
  const { user, session } = useAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";

  const isSuperAdmin = (user?.email || "").toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!session?.access_token || !isSuperAdmin) return;
    fetchKeys();
  }, [session?.access_token, isSuperAdmin]);

  const fetchKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/keys`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Failed to load API keys.");
      }
    } catch (e: any) {
      setError("Failed to connect to backend service.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to issue API key.");
      }
      setCreatedKey(data.api_key);
      setKeys([data, ...keys]);
      setNewKeyName("");
    } catch (e: any) {
      setError(e.message || "Could not generate key.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Revoke this developer API key permanently? Active integrations will lose access.")) {
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/keys/${keyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== keyId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = async (text: string, isCurl: boolean = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isCurl) {
        setCopiedCurl(true);
        setTimeout(() => setCopiedCurl(false), 2000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
    } catch (e) {}
  };

  // Security gate: strictly visible to makeromusa17@gmail.com
  if (!isSuperAdmin) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-white">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-[#090d19] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Super Admin Restricted</h2>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Developer API Key administration is exclusively restricted to the primary system owner (
            <span className="text-amber-400 font-mono">{SUPER_ADMIN_EMAIL}</span>). Standard administrators do not possess authorization to view or issue programmatic tokens.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/overview"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Overview</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sampleCurl = `curl -X POST "${apiUrl}/api/v1/chat" \\
  -H "X-API-Key: ${createdKey || "edurag_live_YOUR_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "unit_code": "SCS 3201",
    "query": "Explain ACID properties and transaction isolation levels",
    "deep_search": true
  }'`;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-400 shadow-md">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Developer API Platform
              </h1>
              <span className="rounded bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                Super Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Issue and revoke programmatic API keys for external services, bots, and CLI integrations
            </p>
          </div>
        </div>

        <button
          onClick={fetchKeys}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Secret Key Alert (Shown once upon generation) */}
      {createdKey && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1.5">
            <Shield className="h-4 w-4" />
            <span>New API Key Issued Successfully! Copy it now (will not be displayed again):</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-black/50 border border-emerald-500/30 p-3 font-mono text-xs text-emerald-300 break-all">
            <span>{createdKey}</span>
            <button
              onClick={() => copyToClipboard(createdKey)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shrink-0 shadow-md"
            >
              {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey ? "Copied" : "Copy Key"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Key Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-400" />
          <span>Issue New API Key</span>
        </h3>
        <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key label (e.g. Master Production Integration, Telegram Bot, Research Script)..."
            className="flex-1 rounded-xl border border-slate-800 bg-[#0c121e] px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={isCreating || !newKeyName.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-6 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-md shadow-purple-600/20 shrink-0"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>Issue Key</span>
          </button>
        </form>
      </div>

      {/* Active API Keys Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-400" />
            <span>Active Programmatic Keys ({keys.length})</span>
          </h3>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Connecting to MongoDB Atlas `api_keys` collection...
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
            No API keys issued yet. Generate your first developer key above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="pb-3 px-3">Label</th>
                  <th className="pb-3 px-3">Key Prefix</th>
                  <th className="pb-3 px-3">Created</th>
                  <th className="pb-3 px-3">Last Used</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 font-semibold text-white">{k.name}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-purple-400">
                      <span className="rounded bg-purple-950/50 border border-purple-800/40 px-2 py-0.5">
                        {k.prefix}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {k.created_at ? new Date(k.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition"
                        title="Revoke Key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Developer API Documentation & Quickstart */}
      <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-blue-400" />
            <span>Developer Quickstart & Endpoints (REST v1)</span>
          </h3>
          <button
            onClick={() => copyToClipboard(sampleCurl, true)}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            {copiedCurl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedCurl ? "Copied" : "Copy cURL"}</span>
          </button>
        </div>

        <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-[11px] font-mono text-slate-300 border border-slate-800 leading-relaxed">
          {sampleCurl}
        </pre>

        {/* Available Endpoints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-emerald-400 font-bold text-xs">POST /api/v1/chat</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Core RAG</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Accepts <code>unit_code</code>, <code>query</code>, and <code>deep_search</code>. Returns grounded answers with slide citations and live web sources.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-blue-400 font-bold text-xs">POST /api/v1/assignments/solve</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Solver</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Synthesizes an academic assignment solution with syllabus grounding, Mermaid architecture diagrams, and viva defense questions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-purple-400 font-bold text-xs">POST /api/v1/diagrams/generate</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Diagrams</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Produces executable Mermaid.js diagrams for flowcharts, ERDs, UML class structures, and distributed architectures.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-amber-400 font-bold text-xs">GET /api/v1/units</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Curriculum</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Lists all active university course units registered in the system with syllabus metadata and venue details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
