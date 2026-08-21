import React from "react";
import Link from "next/link";
import { ShieldCheck, Key, Cpu, Users, ArrowUpRight, Activity } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <span className="text-xs font-semibold text-contour-red uppercase tracking-wider">
          Super Admin Plane
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-0.5">
          Contour Control Plane
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Multi-tenant governance, Dokploy container status, and machine MCP keys.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/mcp"
          className="bg-white rounded-2xl p-6 border border-border shadow-card hover:shadow-floating transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-paper-200 flex items-center justify-center text-contour-red mb-4 group-hover:scale-110 transition-transform">
            <Key className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-ink-900 flex items-center justify-between">
            <span>MCP Studio & API Keys</span>
            <ArrowUpRight className="w-4 h-4 text-ink-400 group-hover:text-contour-red" />
          </h3>
          <p className="text-xs text-ink-600 mt-1">
            Manage user-scoped Bearer tokens with 1-click compromise revocation for Antigravity, Claude, and Cursor.
          </p>
        </Link>

        <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
          <div className="w-10 h-10 rounded-xl bg-paper-200 flex items-center justify-center text-contour-emerald mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-ink-900">Dokploy Cluster Health</h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-contour-emerald font-semibold">
            <span className="w-2 h-2 rounded-full bg-contour-emerald animate-pulse" />
            <span>All 3 Containers Healthy</span>
          </div>
          <p className="text-[11px] text-ink-600 mt-1">Next.js Standalone • PostgreSQL 16 • Redis</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
          <div className="w-10 h-10 rounded-xl bg-paper-200 flex items-center justify-center text-ink-900 mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-ink-900">POPIA Audit Trail</h3>
          <div className="font-mono text-xl font-bold text-ink-900 mt-1">
            142 Events Logged
          </div>
          <p className="text-[11px] text-ink-600 mt-1">Zero unmasked PII leaks detected</p>
        </div>
      </div>
    </div>
  );
}
