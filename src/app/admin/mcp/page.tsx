"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Key, ShieldAlert, Copy, Check, Plus, Terminal, RefreshCw } from "lucide-react";

export default function AdminMcpPage() {
  const [keys, setKeys] = useState([
    {
      id: "key_01",
      name: "Workstation Antigravity",
      keyPreview: "banya_live_9f82...3e1a",
      status: "active",
      lastUsed: "2 mins ago",
    },
    {
      id: "key_02",
      name: "Claude MacBook Air",
      keyPreview: "banya_live_1a44...88dc",
      status: "active",
      lastUsed: "1 hour ago",
    },
  ]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleRevoke = (id: string) => {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: "revoked" } : k))
    );
    alert("Key immediately revoked! All agent calls with this Bearer token will receive HTTP 403.");
  };

  const handleGenerateKey = () => {
    const newKey = {
      id: `key_${Date.now()}`,
      name: "New Cursor IDE Key",
      keyPreview: `banya_live_${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`,
      status: "active",
      lastUsed: "Never",
    };
    setKeys((prev) => [newKey, ...prev]);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-contour-red uppercase tracking-wider">
            Machine Interface
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-0.5">
            Model Context Protocol (MCP) Studio
          </h1>
          <p className="text-xs text-ink-600 mt-1">
            Generate and manage user-scoped Bearer tokens for external AI agents with 1-click compromise revocation.
          </p>
        </div>

        <button
          onClick={handleGenerateKey}
          className="px-4 py-2.5 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-semibold transition-transform active:scale-95 shadow-subtle flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* Keys List */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-ink-900">Active Agent Keys ({keys.length})</h3>
          <span className="text-xs text-ink-600">Endpoint: POST /api/mcp</span>
        </div>

        <div className="divide-y divide-border">
          {keys.map((k) => (
            <div key={k.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-ink-900">{k.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      k.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {k.status.toUpperCase()}
                  </span>
                </div>
                <div className="font-mono text-xs text-ink-600">
                  {k.keyPreview} • Last active: {k.lastUsed}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {k.status === "active" && (
                  <button
                    onClick={() => handleRevoke(k.id)}
                    className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-contour-red text-xs font-semibold border border-red-200 transition-colors flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Revoke Key</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Configuration Snippet */}
      <div className="bg-paper-200 rounded-2xl p-6 border border-border space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-ink-900">
          <Terminal className="w-4 h-4 text-contour-red" />
          <span>Antigravity & Claude Desktop Connection Configuration</span>
        </div>
        <pre className="p-4 rounded-xl bg-ink-950 text-paper-200 font-mono text-xs overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "contour": {
      "url": "https://contour.app/api/mcp",
      "headers": {
        "Authorization": "Bearer banya_live_your_key_here"
      }
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
}
