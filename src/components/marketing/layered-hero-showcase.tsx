"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Building,
  MapPin,
  Lock,
  Layers,
  Sparkles,
  Search,
  Compass,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Smartphone,
  Zap,
  Filter,
  Navigation,
  Globe,
} from "lucide-react";

export function LayeredHeroShowcase() {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<"KABULONGA" | "LEOPARDS_HILL" | "ROMA">("KABULONGA");

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl border border-white/20 bg-white/95 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300">
      
      {/* Top Header inside Solidroad Card */}
      <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#ECE7DE] flex items-center justify-between">
        <span className="text-xs font-serif font-bold text-stone-600 tracking-wide uppercase">
          Portfolio & Cadastral Operations
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Live Lusaka GIS Active
          </span>
        </div>
      </div>

      {/* 3 Top Core Metrics (Exact Solidroad 3-Metric Header) */}
      <div className="grid grid-cols-3 gap-6 px-6 py-5 bg-white border-b border-[#ECE7DE]">
        <div>
          <div className="font-serif text-2xl sm:text-4xl font-extrabold text-[#16382B] tracking-tight">
            K 142.5M
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 font-medium mt-0.5">
            Active Mandates Portfolio
          </p>
        </div>

        <div>
          <div className="font-serif text-2xl sm:text-4xl font-extrabold text-[#C89B3C] tracking-tight">
            48 Stands
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 font-medium mt-0.5">
            Prime Lusaka Parcels
          </p>
        </div>

        <div>
          <div className="font-serif text-2xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight">
            100%
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 font-medium mt-0.5">
            Title Deed Verified
          </p>
        </div>
      </div>

      {/* Main Content Area: Map Canvas + Floating Property + Right Sidebar Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px] bg-[#FAF8F5]">
        
        {/* Left 8 Cols: Interactive Property Map of Luxury Neighborhood */}
        <div className="lg:col-span-8 p-4 sm:p-5 relative flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#ECE7DE]">
          
          {/* Map Topographic Background with Cadastral Plot Geometry */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cadastral-hero-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#16382B" strokeWidth="0.75" strokeDasharray="2 3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cadastral-hero-grid)" />
              {/* Topographic Elevation Paths */}
              <path d="M-50 120 Q 200 40 450 140 T 900 100" fill="none" stroke="#16382B" strokeWidth="2" opacity="0.4" />
              <path d="M-50 220 Q 250 140 550 260 T 950 180" fill="none" stroke="#16382B" strokeWidth="1.5" opacity="0.3" />
              <path d="M-50 320 Q 300 240 650 360 T 1000 280" fill="none" stroke="#16382B" strokeWidth="1.2" opacity="0.25" />
            </svg>
          </div>

          {/* Suburb Pill Switcher over Map */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-white/95 rounded-xl border border-[#E6E0D4] shadow-xs text-[11px] font-semibold">
              <button
                onClick={() => setSelectedNeighborhood("KABULONGA")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedNeighborhood === "KABULONGA"
                    ? "bg-[#16382B] text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Kabulonga
              </button>
              <button
                onClick={() => setSelectedNeighborhood("LEOPARDS_HILL")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedNeighborhood === "LEOPARDS_HILL"
                    ? "bg-[#16382B] text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Leopards Hill
              </button>
              <button
                onClick={() => setSelectedNeighborhood("ROMA")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedNeighborhood === "ROMA"
                    ? "bg-[#16382B] text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Roma Park
              </button>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 bg-white/80 px-2 py-1 rounded-lg border border-[#E6E0D4]">
              <Navigation className="w-3 h-3 text-[#C89B3C]" />
              15°25&apos;S 28°20&apos;E
            </span>
          </div>

          {/* Cadastral GPS Pins in Map */}
          <div className="relative z-10 py-6 grid grid-cols-2 gap-3 opacity-90">
            <div className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl border border-[#E6E0D4] shadow-xs text-[11px] space-y-1 max-w-[200px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#16382B]">Stand # 8942-A</span>
                <span className="text-emerald-700 font-bold font-mono">2,400m²</span>
              </div>
              <p className="text-[10px] text-stone-500 truncate">Kabulonga Prime • Diplomatic</p>
            </div>

            <div className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl border border-[#E6E0D4] shadow-xs text-[11px] space-y-1 max-w-[200px] justify-self-end">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#16382B]">Stand # 1102-LH</span>
                <span className="text-emerald-700 font-bold font-mono">1,850m²</span>
              </div>
              <p className="text-[10px] text-stone-500 truncate">Leopards Hill Gated Parcel</p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FLOATING LUXURY PROPERTY CARD IN FRONT OF THE PROPERTY MAP */}
          {/* ========================================================================= */}
          <div className="relative z-20 mt-2 p-4 rounded-2xl bg-white border-2 border-[#C89B3C]/50 shadow-2xl ring-1 ring-black/5 flex flex-col sm:flex-row gap-4 items-center">
            
            {/* Property Image Cover */}
            <div className="relative w-full sm:w-40 h-28 sm:h-28 rounded-xl overflow-hidden shrink-0 shadow-inner group">
              <Image
                src="/images/contour/rolling-hills.webp"
                alt="Kabulonga Grand Villa"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[9px] font-mono">
                Kabulonga
              </div>
            </div>

            {/* Property Details & 5% Locked Yield */}
            <div className="flex-1 w-full space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Title Deed Verified
                </span>
                <span className="text-[10px] font-mono text-stone-400">Stand #8942-A</span>
              </div>

              <h4 className="font-serif text-sm sm:text-base font-bold text-[#16382B] leading-tight">
                Kabulonga Grand Executive Villa
              </h4>

              <div className="flex items-center justify-between pt-1 border-t border-[#ECE7DE] text-xs">
                <div>
                  <span className="text-[9px] text-stone-400 block font-mono uppercase">Asking Value</span>
                  <span className="font-bold text-[#16382B] font-mono">K 14,500,000</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-stone-400 block font-mono uppercase">5% Commission</span>
                  <span className="font-bold text-emerald-700 font-mono">K 725,000</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right 4 Cols: Solidroad-Style Filter & Metric List */}
        <div className="lg:col-span-4 p-5 bg-white space-y-4 text-xs">
          
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold tracking-wider">
              Cadastral Source
            </span>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#ECE7DE]">
              <span className="font-semibold text-stone-700">Ministry of Lands GIS</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold tracking-wider">
              Land Zoning
            </span>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#ECE7DE]">
              <span className="font-semibold text-stone-700">Residential R-1 / Prime</span>
              <span className="text-[10px] font-mono text-[#C89B3C] font-bold">Zone 4</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold tracking-wider">
              Broker Custody Filter
            </span>
            <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#ECE7DE] space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-500">Anti-Poach Lock:</span>
                <span className="font-bold text-emerald-700">30-Day Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Field PWA Cache:</span>
                <span className="font-bold text-[#16382B] font-mono">0ms Lag</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#ECE7DE]">
            <Link
              href="/dashboard/map"
              className="w-full py-2.5 rounded-xl bg-[#16382B] hover:bg-[#0F291E] text-[#E8C265] text-center text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Explore Live GIS Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
