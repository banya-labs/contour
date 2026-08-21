"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  MapPin,
  Lock,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Share2,
  CheckCircle2,
  FileText,
  UserCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function FieldAgentPwaMockup() {
  const [activeTab, setActiveTab] = useState<"mandates" | "antipoach" | "splits">("mandates");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (index: number) => {
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section className="py-20 bg-paper-100 border-b border-border" id="pwa-showcase">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & Value Pillars */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-200 border border-border text-ink-800 text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-contour-amber" />
              Field Companion Kiosk
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 tracking-tight leading-[1.15]">
              Built for the Field: Zero-Install PWA That Defies Load-Shedding
            </h2>

            <p className="text-sm sm:text-base text-ink-600 leading-relaxed">
              Equip your field brokers with a high-contrast mobile companion (<code className="bg-paper-200 px-1.5 py-0.5 rounded text-contour-dark font-mono text-xs">/kiosk</code>) powered by <strong className="text-ink-900">PowerSync local SQLite WASM</strong>. Access property stand boundaries, asking prices, and client profiles even when 8-hour ZESCO load-shedding knocks out cellular towers in New Kasama or Silverest.
            </p>

            {/* 3 Value Pillars */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 bg-white p-4 rounded-xl border border-border shadow-card">
                <div className="w-9 h-9 rounded-lg bg-contour-emerald/10 text-contour-emerald flex items-center justify-center shrink-0 mt-0.5">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wide">
                    PowerSync Offline-First SQLite Engine
                  </h3>
                  <p className="text-xs text-ink-600 mt-0.5 leading-relaxed">
                    Zero-latency local database on the agent’s phone. Search active listings, check title custody, and pull up cadastral survey folios with zero mobile data.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white p-4 rounded-xl border border-border shadow-card">
                <div className="w-9 h-9 rounded-lg bg-contour-red/10 text-contour-red flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wide">
                    30-Day Anti-Poaching Client Custody
                  </h3>
                  <p className="text-xs text-ink-600 mt-0.5 leading-relaxed">
                    Every buyer or tenant inquiry logged in the field is cryptographically locked to that agent for 30 days. Eliminates internal commission disputes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white p-4 rounded-xl border border-border shadow-card">
                <div className="w-9 h-9 rounded-lg bg-contour-amber/10 text-contour-amber flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wide">
                    Southern African Landmark Cues
                  </h3>
                  <p className="text-xs text-ink-600 mt-0.5 leading-relaxed">
                    Replaces non-existent street numbers with actionable regional cues (e.g. <em>&quot;200m off Kabulonga Road, near Centro Mall&quot;</em>).
                  </p>
                </div>
              </div>
            </div>

            {/* Launch Kiosk Surface Link */}
            <div className="pt-2">
              <Link
                href="/kiosk"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-contour-dark hover:bg-ink-950 text-white text-xs font-semibold transition-all shadow-subtle"
              >
                <span>Launch Live Field Kiosk Surface (/kiosk)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: 390px Realistic Smartphone Frame Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[360px] sm:max-w-[390px] rounded-[36px] bg-ink-950 p-3 shadow-floating border-4 border-ink-800">
              {/* Phone Screen Container */}
              <div className="rounded-[28px] bg-slate-950 text-slate-100 overflow-hidden border border-slate-800 flex flex-col h-[580px]">
                {/* Status Bar */}
                <div className="px-5 pt-3 pb-2 flex items-center justify-between text-[11px] text-slate-400 font-mono border-b border-slate-900">
                  <span>09:41</span>
                  <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-400 font-bold">SQLITE</span>
                    <Battery className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Agent Header & Offline Status */}
                <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-contour-red/20 border border-contour-red text-contour-red flex items-center justify-center font-bold text-xs">
                      TM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>Tembo Mwape</span>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Senior Field Broker</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Offline Ready
                  </div>
                </div>

                {/* Suburb / Mode Tabs */}
                <div className="p-2 bg-slate-900/50 grid grid-cols-3 gap-1 border-b border-slate-800 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("mandates")}
                    className={`py-1.5 rounded-lg transition-colors text-center ${
                      activeTab === "mandates"
                        ? "bg-slate-800 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Mandates
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("antipoach")}
                    className={`py-1.5 rounded-lg transition-colors text-center ${
                      activeTab === "antipoach"
                        ? "bg-slate-800 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Anti-Poach
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("splits")}
                    className={`py-1.5 rounded-lg transition-colors text-center ${
                      activeTab === "splits"
                        ? "bg-slate-800 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Splits
                  </button>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans">
                  {activeTab === "mandates" && (
                    <>
                      {/* Mandate 1: Kabulonga */}
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold font-mono">
                            FOR SALE • SOLE MANDATE
                          </span>
                          <span className="text-slate-400 font-mono">Stand # 8942-A</span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-tight">
                          Executive 4-Bed Standalone Residence
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-amber-300">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">200m off Kabulonga Rd, near Centro Mall</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                          <div className="font-mono text-sm font-bold text-white">
                            K 3,500,000
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(1)}
                            className="px-2.5 py-1 rounded bg-contour-red hover:bg-contour-red/80 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Share2 className="w-3 h-3" />
                            {copiedIndex === 1 ? "Flyer Copied!" : "WhatsApp Flyer"}
                          </button>
                        </div>
                      </div>

                      {/* Mandate 2: Leopards Hill */}
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold font-mono">
                            FOR RENT • DIPLOMATIC
                          </span>
                          <span className="text-slate-400 font-mono">Stand # 1102</span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-tight">
                          Modern 3-Bed Townhouse (Gated Estate)
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-amber-300">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">Opposite American International School</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                          <div className="font-mono text-sm font-bold text-white">
                            $ 2,200 / mo
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(2)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Share2 className="w-3 h-3" />
                            {copiedIndex === 2 ? "Flyer Copied!" : "WhatsApp Flyer"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "antipoach" && (
                    <div className="space-y-2.5">
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> 30-DAY ACTIVE LOCK
                          </span>
                          <span className="font-mono text-amber-400">24 Days Left</span>
                        </div>
                        <div className="text-xs font-bold text-white">Nchimunya Mweene (Buyer)</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Budget: K 4,000,000 • Kabulonga / Sunningdale
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-400" /> Assigned Exclusively to Tembo Mwape
                        </div>
                      </div>

                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> 30-DAY ACTIVE LOCK
                          </span>
                          <span className="font-mono text-amber-400">18 Days Left</span>
                        </div>
                        <div className="text-xs font-bold text-white">EU Diplomatic Mission (Tenant)</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Budget: $ 2,500/mo • Leopards Hill / Woodlands
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-400" /> Assigned Exclusively to Chipo Banda
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "splits" && (
                    <div className="space-y-2.5">
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          August 2026 Earned Splits
                        </span>
                        <div className="font-mono text-xl font-bold text-emerald-400">
                          K 87,500
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-300 border-t border-slate-800 pt-2">
                          <div className="flex justify-between">
                            <span>Kabulonga 4-Bed (50% Split):</span>
                            <span className="font-mono text-white">K 87,500</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Pending Escrow Release:</span>
                            <span className="font-mono text-amber-400">State Consent</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Phone Bottom Navigation Bar */}
                <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-around text-[10px] text-slate-400">
                  <div className="flex flex-col items-center text-emerald-400 font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span>Kiosk</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <MapPin className="w-4 h-4" />
                    <span>Map</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FileText className="w-4 h-4" />
                    <span>Deeds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
