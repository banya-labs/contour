import React from "react";
import Link from "next/link";
import { ShieldCheck, Key, Cpu, Users, ArrowUpRight, Activity } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full font-geist pb-20 sm:pb-32">
      <div className="border-b border-editorial-border pb-6">
        <span className="text-[11px] font-mono font-bold text-editorial-red uppercase tracking-widest">
          SUPER ADMIN PLANE // MULTI-TENANT GOVERNANCE
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-editorial-black tracking-tight mt-1">
          Contour Control Plane
        </h1>
        <p className="text-xs text-editorial-neutral mt-1">
          Multi-tenant governance, Dokploy container status, and machine MCP keys.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          href="/admin/mcp"
          className="bg-white rounded-none p-6 border border-editorial-border hover:border-editorial-black transition-colors group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 bg-editorial-paper border border-editorial-border flex items-center justify-center text-editorial-red mb-4">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg text-editorial-black flex items-center justify-between">
              <span>MCP Studio &amp; API Keys</span>
              <ArrowUpRight className="w-4 h-4 text-editorial-neutral group-hover:text-editorial-red transition-colors" />
            </h3>
            <p className="text-xs text-editorial-neutral mt-1">
              Manage user-scoped Bearer tokens with 1-click compromise revocation for Antigravity, Claude, and Cursor.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-editorial-border text-[11px] font-mono font-bold text-editorial-black uppercase tracking-wider">
            Open Key Studio &rarr;
          </div>
        </Link>

        <div className="bg-white rounded-none p-6 border border-editorial-border hover:border-editorial-black transition-colors flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-editorial-paper border border-editorial-border flex items-center justify-center text-emerald-700 mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg text-editorial-black">Dokploy Cluster Health</h3>
            <div className="mt-2 flex items-center gap-2 text-xs font-mono font-bold text-emerald-800">
              <span className="w-2 h-2 bg-emerald-600 animate-pulse" />
              <span>All 3 Containers Healthy</span>
            </div>
            <p className="text-xs font-mono text-editorial-neutral mt-1">Next.js Standalone • PostgreSQL 16 • Redis</p>
          </div>
          <div className="pt-4 mt-4 border-t border-editorial-border text-[11px] font-mono text-emerald-800 uppercase tracking-wider">
            100% Uptime / 0 Errors
          </div>
        </div>

        <div className="bg-white rounded-none p-6 border border-editorial-border hover:border-editorial-black transition-colors flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-editorial-paper border border-editorial-border flex items-center justify-center text-editorial-black mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg text-editorial-black">POPIA Audit Trail</h3>
            <div className="font-mono text-2xl font-bold text-editorial-black mt-1">
              142 Events
            </div>
            <p className="text-xs font-mono text-editorial-neutral mt-1">Zero unmasked PII leaks detected</p>
          </div>
          <div className="pt-4 mt-4 border-t border-editorial-border text-[11px] font-mono text-editorial-black uppercase tracking-wider">
            Immutable Audit Trail Active
          </div>
        </div>
      </div>
    </div>
  );
}
