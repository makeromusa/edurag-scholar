"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Code2,
  Terminal,
  Shield,
  Loader2,
  AlertTriangle,
  ExternalLink,
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

interface DeveloperApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperApiModal: React.FC<DeveloperApiModalProps> = ({ isOpen, onClose }) => {
  const { session } = useAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";

  useEffect(() => {
    if (!isOpen || !session?.access_token) return;
    fetchKeys();
  }, [isOpen, session?.access_token]);

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
      }
    } catch (e: any) {
      setError("Failed to load developer keys.");
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
    if (!confirm("Are you sure you want to revoke this API key? Applications using it will lose access.")) {
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

  if (!isOpen) return null;

  const sampleCurl = `curl -X POST "${apiUrl}/api/v1/chat" \\
  -H "X-API-Key: ${createdKey || "edurag_live_YOUR_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "unit_code": "SCS 3201",
    "query": "Explain ACID properties and transaction isolation levels",
    "deep_search": true
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">EduRAG Developer API Platform</h3>
              <p className="text-xs text-slate-400">
                Programmatic access to academic RAG, diagram generators, and assignment solvers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Newly Issued Secret Banner */}
        {createdKey && (
          <div className="my-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
              <Shield className="h-4 w-4" />
              <span>New API Key Generated! Copy it now (will not be shown again):</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-black/40 border border-emerald-500/30 p-2 font-mono text-xs text-emerald-300 break-all">
              <span>{createdKey}</span>
              <button
                onClick={() => copyToClipboard(createdKey)}
                className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 transition shrink-0"
              >
                {copiedKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedKey ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Generate Key Input */}
        <form onSubmit={handleCreateKey} className="mt-4 flex gap-2">
          <input
            type="text"
            required
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key label (e.g. CLI Script, Telegram Bot, Research Project)..."
            className="flex-1 rounded-xl border border-slate-800 bg-[#090d16] px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isCreating || !newKeyName.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition disabled:opacity-50 shrink-0"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>Generate Key</span>
          </button>
        </form>

        {/* Active Keys List */}
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Active Developer Keys
          </h4>
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
              Loading developer keys from MongoDB...
            </div>
          ) : keys.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-[#090d16] p-4 text-center text-xs text-slate-500">
              No API keys generated yet. Enter a label above to create your first programmatic key.
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#090d16] px-3.5 py-2.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{k.name}</span>
                      <span className="font-mono text-[10px] text-purple-400 bg-purple-950/40 border border-purple-800/40 rounded px-1.5 py-0.2">
                        {k.prefix}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Created: {new Date(k.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRevokeKey(k.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
                    title="Revoke Key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Developer Endpoints & Quickstart */}
        <div className="mt-6 border-t border-slate-800/80 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-blue-400" />
              <span>Quickstart Example (cURL)</span>
            </h4>
            <button
              onClick={() => copyToClipboard(sampleCurl, true)}
              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              {copiedCurl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copiedCurl ? "Copied" : "Copy cURL"}</span>
            </button>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3 text-[11px] font-mono text-slate-300 border border-slate-800/80 leading-relaxed">
            {sampleCurl}
          </pre>

          {/* Endpoints Table */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-slate-800 bg-[#090d16] p-2.5">
              <span className="font-mono text-emerald-400 font-bold">POST /api/v1/chat</span>
              <p className="text-slate-400 text-[10px] mt-0.5">
                RAG answer with slide citations & live web search
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#090d16] p-2.5">
              <span className="font-mono text-blue-400 font-bold">POST /api/v1/assignments/solve</span>
              <p className="text-slate-400 text-[10px] mt-0.5">
                Syllabus-grounded solution & Mermaid diagrams
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#090d16] p-2.5">
              <span className="font-mono text-purple-400 font-bold">POST /api/v1/diagrams/generate</span>
              <p className="text-slate-400 text-[10px] mt-0.5">
                Executable Mermaid diagram code synthesizer
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#090d16] p-2.5">
              <span className="font-mono text-amber-400 font-bold">GET /api/v1/units</span>
              <p className="text-slate-400 text-[10px] mt-0.5">
                List all curriculum units & lecture syllabi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
