"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, Building, DollarSign, ArrowRight, ShieldCheck, Sparkles, ChevronDown } from "lucide-react";

export function LuxuryHeroStage() {
  const [selectedLocation, setSelectedLocation] = useState("All Lusaka Prime");
  const [selectedType, setSelectedType] = useState("Luxury Residential");
  const [selectedPrice, setSelectedPrice] = useState("$250k - $1M+");

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between pt-28 pb-16 overflow-hidden bg-[#FAF8F5]">
      {/* Top Ambient Glow / Architectural Background Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-[#E57A1A]/10 via-[#FAF8F5]/40 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-32 left-1/4 w-[400px] h-[300px] bg-emerald-900/5 blur-3xl rounded-full" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex-1 flex flex-col items-center justify-center">
        {/* Subtle Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/60 border border-stone-300/80 text-stone-800 text-[11px] font-semibold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="w-2 h-2 rounded-full bg-[#E57A1A] animate-pulse" />
          <span>Southern Africa’s Premier Luxury Brokerage & Field OS</span>
        </div>

        {/* Primary Monolithic Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-[#141715] tracking-tight leading-[1.08] max-w-5xl mb-5">
          Find What <span className="italic font-normal text-stone-700">Moves You.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-stone-600 text-sm sm:text-base md:text-lg max-w-2xl font-medium leading-relaxed mb-8">
          Expert agents. Real guidance. A smarter path to find luxury estates, commercial acreage, and high-yield leases in Lusaka.
        </p>

        {/* Floating 3D Villa Showcase Stage */}
        <div className="relative w-full max-w-4xl mx-auto my-4 h-[280px] sm:h-[360px] md:h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-stone-200/80 group">
          {/* Architectural Villa Render / Visual */}
          <div className="absolute inset-0 bg-[#0F1E16]">
            <Image
              src="/images/contour/luxury-villa-hero.png"
              alt="Luxury Modern Architecture in Lusaka"
              fill
              priority
              className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 opacity-95"
            />
            {/* Atmospheric Mist Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-transparent to-black/30" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#FAF8F5] to-transparent" />
          </div>

          {/* Floating Luxury Tag / Overlay Details */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-20">
            <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/40 shadow-lg text-left">
              <div className="flex items-center gap-1.5 text-[#E57A1A] text-xs font-bold uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Mandate</span>
              </div>
              <div className="text-stone-900 font-serif font-bold text-base sm:text-lg">
                The Glasshouse Estate
              </div>
              <div className="text-stone-500 text-xs font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                <span>Leopards Hill, Lusaka • $1,250,000</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-[#141715]/85 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-white text-xs font-semibold shadow-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Direct Ministry Title Verified</span>
            </div>
          </div>
        </div>

        {/* Interactive Search Bar Pill (Luxury Editorial Filter) */}
        <div className="w-full max-w-4xl mx-auto mt-6 p-2 bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-full border border-stone-200/90 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Location Selector */}
          <div className="w-full sm:w-auto flex-1 px-4 py-2.5 text-left border-b sm:border-b-0 sm:border-r border-stone-100 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-[#E57A1A] shrink-0" />
            <div className="flex-1">
              <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Location</div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-stone-800 outline-none cursor-pointer"
              >
                <option value="All Lusaka Prime">All Lusaka Prime</option>
                <option value="Kabulonga">Kabulonga</option>
                <option value="Leopards Hill">Leopards Hill</option>
                <option value="Roma Park">Roma Park</option>
                <option value="Woodlands">Woodlands</option>
                <option value="Ibex Hill">Ibex Hill</option>
              </select>
            </div>
          </div>

          {/* Property Type Selector */}
          <div className="w-full sm:w-auto flex-1 px-4 py-2.5 text-left border-b sm:border-b-0 sm:border-r border-stone-100 flex items-center gap-3">
            <Building className="w-4 h-4 text-stone-500 shrink-0" />
            <div className="flex-1">
              <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Property Type</div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-stone-800 outline-none cursor-pointer"
              >
                <option value="Luxury Residential">Luxury Residential</option>
                <option value="Commercial Land">Commercial Land</option>
                <option value="Diplomatic Rental">Diplomatic Rental</option>
                <option value="Gated Villa">Gated Villa</option>
              </select>
            </div>
          </div>

          {/* Price Range Selector */}
          <div className="w-full sm:w-auto flex-1 px-4 py-2.5 text-left flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-stone-500 shrink-0" />
            <div className="flex-1">
              <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Price Range</div>
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-stone-800 outline-none cursor-pointer"
              >
                <option value="$100k - $250k">$100k - $250k</option>
                <option value="$250k - $500k">$250k - $500k</option>
                <option value="$500k - $1M+">$500k - $1M+</option>
                <option value="$1M - $5M+">$1M - $5M+</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <Link
            href="#properties"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl sm:rounded-full bg-[#141715] hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-md group shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Explore Properties</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Micro Trust Proof Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center relative z-10">
        <div className="inline-flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-stone-500 border-t border-stone-200/60 pt-6">
          <span>K920k Commission Protected</span>
          <span className="w-1 h-1 rounded-full bg-stone-300" />
          <span>Zero-Latency Offline Field App</span>
          <span className="w-1 h-1 rounded-full bg-stone-300" />
          <span>100% POPIA / PACRA Compliant Title Custody</span>
        </div>
      </div>
    </section>
  );
}
