"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Smartphone,
} from "lucide-react";

export function CinematicHeroStage() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Trigger smooth slide-in from bottom on mount
    const timer = setTimeout(() => setHasMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#0B1711] text-white pt-32 pb-8">
      {/* 1. Cinematic Background Layer: The Expansive Savanna Landscape with Extended Sky */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/contour/0 - luxury-villa-landscape.png"
          alt="African Savanna Landscape Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Subtle Atmospheric Vignette - keeps text readable without obscuring the landscape */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1711] via-transparent to-black/35 pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-full lg:w-2/3 bg-gradient-to-r from-[#0B1711]/90 via-[#0B1711]/45 to-transparent pointer-events-none" />
      </div>

      {/* 2. Floating House Layer: Luxury Cantilevered Villa Sliding In from the Bottom */}
      <div
        className={`absolute inset-0 z-[2] pointer-events-none transition-all duration-1000 ease-out ${
          hasMounted
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0"
        }`}
      >
        <Image
          src="/images/contour/1 - luxury-villa-hero-house.png"
          alt="Contour Luxury Architectural Villa"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* 3. Ambient Architectural Lighting Accents */}
      <div className="absolute inset-0 pointer-events-none z-[3]">
        <div className="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-[#E57A1A]/10 blur-[130px] rounded-full" />
      </div>

      {/* 4. Left-Aligned Minimal Hero Content (Inspired by Solidroad Reference) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-center my-auto pt-6 sm:pt-10">
        <div className="max-w-2xl text-left">
          {/* Flagship Pilot & Regional Tag */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-6 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#E57A1A] animate-pulse" />
            <span>Southern Africa’s Real Estate OS</span>
            <span className="text-white/40 hidden sm:inline">•</span>
            <span className="text-[#E57A1A] font-bold hidden sm:inline">MAL's Property Showcase</span>
          </div>

          {/* Minimal Editorial Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.06] mb-6 drop-shadow-xl">
            Where architectural luxury <br />
            <span className="italic font-serif font-normal text-[#E57A1A]">meets field velocity.</span>
          </h1>

          {/* Minimal Editorial Subtitle */}
          <p className="text-stone-200/90 text-base sm:text-lg md:text-xl font-normal leading-relaxed mb-8 drop-shadow max-w-xl">
            From diplomatic residences in Kabulonga to commercial acreage in Rhodes Park. Contour unifies 5% commission accounting, offline GPS landmark mapping, and instant branded WhatsApp flyers.
          </p>

          {/* Action CTAs: Bold Pill CTA (Solidroad Style) + Secondary Mobile PWA */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-full bg-[#E57A1A] hover:bg-[#E57A1A]/90 text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-[#E57A1A]/30 hover:shadow-[#E57A1A]/50 hover:scale-[1.02] flex items-center gap-2.5 group cursor-pointer"
            >
              <span>Launch Operations</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/agent"
              className="px-7 py-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold text-sm tracking-wide transition-all hover:scale-[1.02] flex items-center gap-2.5"
            >
              <Smartphone className="w-4 h-4 text-[#E57A1A]" />
              <span>Field Agent PWA</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Bottom Partner & Trust Strip (Solidroad Style) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 pb-2 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-6 text-stone-400 text-xs">
          <div className="flex items-center gap-2 font-mono uppercase tracking-widest text-[10px] text-stone-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E57A1A]" />
            <span>Pilot Showcase & Integrations</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 sm:gap-8 font-serif text-stone-300">
            <span className="hover:text-white transition-colors">MAL's Property Consultancy</span>
            <span className="text-white/20">•</span>
            <span className="hover:text-white transition-colors">Rhodes Park HQ</span>
            <span className="text-white/20">•</span>
            <span className="hover:text-white transition-colors">PowerSync SQLite (Offline)</span>
            <span className="text-white/20">•</span>
            <span className="hover:text-white transition-colors">Paystack ZMW / USD</span>
          </div>
        </div>
      </div>
    </section>
  );
}
