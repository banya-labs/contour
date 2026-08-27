"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  Building,
  Key,
  Compass
} from "lucide-react";

interface FilmScrollOverlaysProps {
  currentFrame: number;
  totalFrames: number;
}

export function FilmScrollOverlays({ currentFrame, totalFrames }: FilmScrollOverlaysProps) {
  const p = (currentFrame - 1) / Math.max(totalFrames - 1, 1);

  const getSceneOpacity = (start: number, end: number) => {
    const fade = 0.05;
    if (p < start - fade || p > end + fade) return 0;
    if (p < start) return (p - (start - fade)) / fade;
    if (p > end) return ((end + fade) - p) / fade;
    return 1;
  };

  const scene1 = getSceneOpacity(0.0, 0.25);
  const scene2 = getSceneOpacity(0.30, 0.58);
  const scene3 = getSceneOpacity(0.63, 0.98);

  return (
    <div className="relative z-10 w-full pointer-events-none">
      <div className="h-[400vh] w-full relative">

        {/* ------------------------------------------------------------- */}
        {/* SCENE 1: ARRIVAL & HERO */}
        {/* ------------------------------------------------------------- */}
        <div
          className="fixed inset-0 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-opacity duration-300 pointer-events-none"
          style={{ opacity: scene1 }}
        >
          <div className="max-w-2xl text-left space-y-6 pt-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 border border-white/20 backdrop-blur-md text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Southern Africa Prime Corridors • 15°25&apos;S 28°20&apos;E</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-[1.08] drop-shadow-lg">
              Sovereign Ground. <br />
              <span className="text-emerald-300 italic font-normal">Verified Custody.</span>
            </h1>

            <p className="text-stone-200 text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-lg drop-shadow-md">
              Discover luxury estates, diplomatic villas, and high-yield commercial acreage across Lusaka with 5% locked commission transparency.
            </p>

            <div className="pt-2 flex items-center gap-4 pointer-events-auto">
              <Link
                href="#mandates"
                className="px-6 py-3.5 rounded-full bg-white hover:bg-stone-100 text-stone-950 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xl hover:scale-105"
              >
                <span>Scroll to Explore Mandates</span>
                <ChevronDown className="w-4 h-4 animate-bounce" />
              </Link>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SCENE 2: POOL TERRACE & ARCHITECTURE */}
        {/* ------------------------------------------------------------- */}
        <div
          className="fixed inset-0 flex items-center justify-end max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-opacity duration-300 pointer-events-none"
          style={{ opacity: scene2 }}
        >
          <div className="max-w-md bg-[#0B1711]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl text-left space-y-4 pointer-events-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Stand #8942-A • Prime Parcel
              </span>
              <span className="text-xs font-mono text-stone-300 font-bold">2,400m²</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              The Glasshouse Estate
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Cantilevered exposed concrete pavilion with floor-to-ceiling solar glass, 25m infinity edge pool, and unencumbered panoramic savanna views.
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
              <div>
                <span className="text-[10px] uppercase text-stone-400 block font-mono">Asking Price</span>
                <span className="font-bold text-white font-mono text-base">$1,250,000</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-stone-400 block font-mono">Protected Yield</span>
                <span className="font-bold text-emerald-400 font-mono text-base">5% Commission</span>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SCENE 3: INTERIOR & TITLE SECURITY */}
        {/* ------------------------------------------------------------- */}
        <div
          className="fixed inset-0 flex items-center justify-start max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-opacity duration-300 pointer-events-none"
          style={{ opacity: scene3 }}
        >
          <div className="max-w-md bg-[#0B1711]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl text-left space-y-5 pointer-events-auto">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                Cadastral Security
              </span>
              <h3 className="text-2xl font-serif font-bold text-white">
                Direct Ministry Lands Verification
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Every mandate undergoes algorithmic title deed inspection, PACRA corporate verification, and 30-day broker anti-poaching lock custody.
            </p>

            <div className="space-y-2 pt-1 text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Zero hidden agency markups</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>0ms latency offline Field Agent PWA</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard/map"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold transition-all shadow-md group"
              >
                <span>Explore Spatial Lusaka GIS</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
