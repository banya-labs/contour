"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, Plus, Terminal } from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full font-geist pb-20 sm:pb-32">
      {/* Top Admin Brand Navigation */}
      <div className="flex items-center justify-between border-b border-editorial-border pb-4">
        <div className="flex items-center gap-2">
          <ContourLogo size="sm" />
          <span className="text-[9px] font-mono uppercase tracking-wider text-editorial-muted bg-neutral-100 px-1.5 py-0.5 border border-editorial-border font-bold">
            MCP Studio
          </span>
        </div>
        <Link
          href="/admin"
          className="text-xs font-mono uppercase tracking-wider text-editorial-muted hover:text-editorial-black flex items-center gap-1 transition-colors"
        >
          <span>&larr; Back to Admin Control</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-editorial-border pb-6">
        <div>
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-editorial-red uppercase tracking-widest">
            MACHINE INTERFACE // BEARER TOKEN HUB
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-editorial-black tracking-tight mt-1 uppercase">
            Model Context Protocol (MCP) Studio
          </h1>
          <p className="text-xs text-editorial-muted mt-1 max-w-2xl">
            Generate and manage user-scoped Bearer tokens for external AI agents with 1-click compromise revocation.
          </p>
        </div>

        <button
          onClick={handleGenerateKey}
          className="px-5 py-2.5 rounded-none bg-editorial-black hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-editorial-red" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* Keys List */}
      <div className="bg-white border border-editorial-border overflow-hidden">
        <div className="p-4 border-b border-editorial-border flex items-center justify-between bg-editorial-paper/30">
          <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-editorial-black">
            Active Agent Keys ({keys.length})
          </h3>
          <span className="text-xs font-mono text-editorial-neutral">POST /api/mcp</span>
        </div>

        <div className="divide-y divide-editorial-border">
          {keys.map((k) => (
            <div key={k.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-editorial-paper/20 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-base text-editorial-black">{k.name}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 border uppercase ${
                      k.status === "active"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-red-50 text-editorial-red border-red-200"
                    }`}
                  >
                    {k.status.toUpperCase()}
                  </span>
                </div>
                <div className="font-mono text-xs text-editorial-neutral">
                  {k.keyPreview} • Last active: {k.lastUsed}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {k.status === "active" && (
                  <button
                    onClick={() => handleRevoke(k.id)}
                    className="px-3.5 py-1.5 rounded-none bg-white hover:bg-red-50 text-editorial-red text-xs font-mono font-bold uppercase tracking-wider border border-red-200 transition-colors flex items-center gap-1"
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
      <div className="bg-editorial-paper/40 border border-editorial-border p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-editorial-black uppercase tracking-wider">
          <Terminal className="w-4 h-4 text-editorial-red" />
          <span>Antigravity &amp; Claude Desktop Connection Configuration</span>
        </div>
        <pre className="p-4 bg-editorial-black text-white font-mono text-xs overflow-x-auto leading-relaxed border border-editorial-black">
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
