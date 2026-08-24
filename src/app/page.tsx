"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  DollarSign,
  MessageSquare,
  Zap,
  Lock,
  Layers,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  Building,
  LogIn,
  Sliders,
  Check,
  Compass,
  Share2,
} from "lucide-react";

import { ContourTopoBackground } from "@/components/marketing/contour-topo-background";
import { LayeredHeroShowcase } from "@/components/marketing/layered-hero-showcase";
import { PropertyShowcaseGallery } from "@/components/marketing/property-showcase-gallery";
import { MapDemoPreview } from "@/components/marketing/map-demo-preview";
import { RoiLeakCalculator } from "@/components/marketing/roi-leak-calculator";
import { PricingMatrix } from "@/components/marketing/pricing-matrix";
import { PopiaFaqAccordion } from "@/components/marketing/popia-faq-accordion";

export default function HomePage() {
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);

  const testimonials = [
    {
      company: "Kabulonga Estates & Holdings",
      quote:
        "We now know our brokers meet our operational bar before they ever present a high-stakes title deed or diplomatic lease. That’s the Contour difference.",
      author: "Chileshe Mwamba",
      role: "Managing Director, Kabulonga Holdings",
      stat1: "50%",
      stat1Label: "Faster time to title verification",
      stat2: "33%",
      stat2Label: "Increase in deal closing speed",
    },
    {
      company: "Leopards Hill Brokerage",
      quote:
        "Field surveys during 8-hour ZESCO load-shedding used to stall our deals for days. With Contour's offline PWA, our brokers never miss a buyer inquiry.",
      author: "Grace Banda",
      role: "Principal Broker, Leopards Hill",
      stat1: "100%",
      stat1Label: "Zero-latency offline survey uptime",
      stat2: "K920k",
      stat2Label: "Earned commission isolated monthly",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1C1A] font-sans antialiased selection:bg-[#DBF400] selection:text-black">
      
      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION HEADER (TRANSPARENT OVER SOLIDROAD SCENE) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#0F1E16]/85 backdrop-blur-md border-b border-white/10 text-white transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          
          {/* Brand Monogram & Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#DBF400] flex items-center justify-center text-black font-serif font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg tracking-tight text-white group-hover:text-[#DBF400] transition-colors leading-none">
                CONTOUR
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-stone-300">
                Real Estate OS
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-stone-200">
            <Link href="#properties" className="hover:text-[#DBF400] transition-colors">
              Property Catalogue
            </Link>
            <Link href="#map" className="hover:text-[#DBF400] transition-colors flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-[#DBF400]" />
              <span>Lusaka Map</span>
            </Link>
            <Link href="#calculator" className="hover:text-[#DBF400] transition-colors">
              Commission ROI
            </Link>
            <Link href="#field-pwa" className="hover:text-[#DBF400] transition-colors">
              Field Companion
            </Link>
            <Link href="#pricing" className="hover:text-[#DBF400] transition-colors">
              Pricing
            </Link>
            <Link href="#compliance" className="hover:text-[#DBF400] transition-colors">
              Security & POPIA
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-stone-300 hover:text-white transition-colors px-2 py-1 flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5 text-stone-400" />
              <span>Sign In</span>
            </Link>

            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-full bg-[#DBF400] hover:bg-[#EDFF2E] text-black text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <span>See a Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION: EXACT SOLIDROAD COMPOSITION WITH NEIGHBORHOOD MAP */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#102416] text-white pt-12 pb-16 sm:pt-16 sm:pb-24">
        
        {/* Full-Bleed Mountain Landscape Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/solidroad/asset_0_UG7DO77CykOXq0OIDltE.png"
            alt="Scenic mountain landscape"
            fill
            priority
            className="object-cover object-center opacity-85"
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D1C12]/80 via-transparent to-[#0A160E]/95" />
        </div>

        {/* The Winding Neon Glowing Contour Road (SVG Vector) */}
        <div className="absolute bottom-0 right-0 w-full sm:w-2/3 h-2/3 z-0 pointer-events-none opacity-90">
          <Image
            src="/images/solidroad/asset_3_knFgtQU9L40WUn6kC2Qq.svg"
            alt="Glowing topographic contour road"
            fill
            className="object-contain object-bottom-right"
          />
        </div>

        {/* Hero 2-Column Grid (Left: Copy, Right: Layered UI Card) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Subtitle, CTA Button */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12] drop-shadow-md">
              The Operations and Mandate OS for Real Estate Teams
            </h1>

            <p className="text-base sm:text-lg text-stone-200 leading-relaxed max-w-lg drop-shadow">
              Your mandates and 5% commissions are what build your firm. Contour is the operating system built around them.
            </p>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#DBF400] hover:bg-[#EDFF2E] text-black text-sm font-bold transition-all shadow-lg hover:scale-105"
              >
                <span>Book a Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Layered Solidroad App Card with Property Map & Floating Card */}
          <div className="lg:col-span-7">
            <LayeredHeroShowcase />
          </div>

        </div>

        {/* Bottom Partner & Client Proof Bar */}
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/15 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-6 text-xs text-stone-300 font-mono">
            <span className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
              Trusted by Premier African Brokerages:
            </span>
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 font-serif font-bold text-stone-300 text-sm">
              <span className="hover:text-white transition-colors">Kabulonga Estates</span>
              <span className="hover:text-white transition-colors">Leopards Hill Holdings</span>
              <span className="hover:text-white transition-colors">Roma Park Commercial</span>
              <span className="hover:text-white transition-colors">Woodlands Capital</span>
              <span className="hover:text-[#DBF400] transition-colors text-xs font-mono">✓ Lands Act Verified</span>
            </div>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. INSTITUTIONAL METRICS & PROOF BAR */}
      {/* ========================================================================= */}
      <section className="border-y border-[#ECE7DE] bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="font-serif text-3xl sm:text-4xl font-extrabold text-[#16382B]">100%</div>
            <p className="text-xs text-stone-500 font-medium mt-1">Zambian Lands Act Compliance</p>
          </div>
          <div>
            <div className="font-serif text-3xl sm:text-4xl font-extrabold text-[#16382B]">5.0%</div>
            <p className="text-xs text-stone-500 font-medium mt-1">Protected Broker Commission</p>
          </div>
          <div>
            <div className="font-serif text-3xl sm:text-4xl font-extrabold text-[#16382B]">0 ms</div>
            <p className="text-xs text-stone-500 font-medium mt-1">Offline Latency (ZESCO Outages)</p>
          </div>
          <div>
            <div className="font-serif text-3xl sm:text-4xl font-extrabold text-[#16382B]">AES-256</div>
            <p className="text-xs text-stone-500 font-medium mt-1">Title Deeds & Mandate Custody</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. THE LIVING LUSAKA PROPERTY CATALOGUE (IMAGE-HEAVY SHOWCASE) */}
      {/* ========================================================================= */}
      <PropertyShowcaseGallery />

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE SPATIAL MAP SHOWCASE */}
      {/* ========================================================================= */}
      <section id="map" className="py-20 bg-white border-t border-[#ECE7DE] relative overflow-hidden">
        <ContourTopoBackground opacity={0.06} strokeColor="#16382B" withGrid={false} />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16382B]/10 text-[#16382B] text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span>SPATIAL CADASTRAL INTELLIGENCE</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#16382B] tracking-tight">
              Interactive Lusaka Property Map & GPS Registry
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Explore live mandates across Kabulonga, Leopards Hill, Roma Park, and Mass Media with exact stand boundaries and 1-click directions for field buyers.
            </p>
          </div>

          {/* Embedded Interactive Map Demo */}
          <MapDemoPreview />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. COMMISSION LEAKS & ROI CALCULATOR */}
      {/* ========================================================================= */}
      <section id="calculator" className="py-20 bg-[#FBF9F5] border-t border-[#ECE7DE]">
        <div className="max-w-7xl mx-auto px-6">
          <RoiLeakCalculator />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FIELD AGENT COMPANION (POWERSYNC OFFLINE PWA) */}
      {/* ========================================================================= */}
      <section id="field-pwa" className="py-20 bg-[#16382B] text-white relative overflow-hidden">
        
        {/* Subtle Topo Lines on Dark Green */}
        <ContourTopoBackground opacity={0.15} strokeColor="#E8C265" withGrid={true} />

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#E8C265] text-xs font-semibold">
              <Smartphone className="w-3.5 h-3.5 text-[#E8C265]" />
              <span>ZERO-LATENCY LOAD-SHEDDING RESILIENCE</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Built for Lusaka Field Agents. <br />
              <span className="text-[#E8C265]">100% Offline with PowerSync.</span>
            </h2>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl">
              During 8–12 hour ZESCO power outages, cellular towers in Leopards Hill and Roma lose data connectivity. Contour runs a local SQLite WASM database directly on your brokers&apos; smartphones—caching all stand GPS coordinates, title deed folios, and client numbers offline.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-[#E8C265] text-sm font-bold">
                  <Zap className="w-4 h-4" />
                  <span>Instant Offline Lookups</span>
                </div>
                <p className="text-xs text-stone-300">
                  Search 250+ properties and stand boundaries with zero internet delay.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-[#E8C265] text-sm font-bold">
                  <Share2 className="w-4 h-4" />
                  <span>1-Click WhatsApp Flyers</span>
                </div>
                <p className="text-xs text-stone-300">
                  Generate branded property cards and share with buyers right from the car.
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Link
                href="/kiosk"
                className="px-6 py-3 rounded-xl bg-[#E8C265] hover:bg-[#F2D17F] text-[#16382B] text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Launch Field Companion (/kiosk)</span>
              </Link>
            </div>
          </div>

          {/* Right Mobile PWA Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[300px] sm:w-[320px] rounded-[40px] border-4 border-stone-700 bg-stone-900 p-3 shadow-2xl ring-1 ring-white/20">
              <div className="relative h-[560px] rounded-[32px] overflow-hidden bg-[#FBF9F5] text-[#1C1C1A] flex flex-col justify-between p-4">
                
                {/* Mobile Top Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DE]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-[#16382B] flex items-center justify-center text-[#E8C265] text-xs font-bold">
                      C
                    </div>
                    <span className="font-serif font-bold text-xs text-[#16382B]">Contour Field</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                    ● Offline Ready
                  </span>
                </div>

                {/* Mobile Property Card */}
                <div className="my-auto space-y-3">
                  <div className="relative h-36 rounded-xl overflow-hidden shadow-sm">
                    <Image
                      src="/images/contour/rolling-hills.webp"
                      alt="Kabulonga Property"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px]">
                      Stand # 8942-A
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#C89B3C] uppercase">Kabulonga East</span>
                    <h4 className="font-serif font-bold text-sm text-[#16382B]">Executive 4-Bed Standalone</h4>
                    <p className="text-xs font-bold text-emerald-700 font-mono">K 14,500,000</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#ECE7DE] text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Ministry Lands Folio:</span>
                      <span className="font-bold text-[#16382B]">#8942-A/2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Locked Exclusivity:</span>
                      <span className="font-bold text-emerald-700">Grace Banda (Active)</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Bottom Action */}
                <Link
                  href="/kiosk"
                  className="w-full py-2.5 rounded-xl bg-[#16382B] text-[#E8C265] text-center text-xs font-bold shadow-sm"
                >
                  Open Field Terminal
                </Link>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TESTIMONIALS & CASE STUDY */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white border-t border-[#ECE7DE]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16382B]/10 text-[#16382B] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span>TESTIMONIALS & PROOF</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#16382B]">
              Trusted by Premier Zambian Agencies
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              Leading brokerages in Lusaka protect their mandates and accelerate settlement timelines with Contour.
            </p>
          </div>

          <div className="lg:col-span-7 bg-[#FBF9F5] p-8 rounded-3xl border border-[#ECE7DE] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-[#16382B]">
                {testimonials[activeTestimonialIndex].company}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setActiveTestimonialIndex(
                      (prev) => (prev - 1 + testimonials.length) % testimonials.length
                    )
                  }
                  className="w-8 h-8 rounded-full bg-white border border-[#E6E0D4] hover:bg-[#F3EFE6] text-[#16382B] flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setActiveTestimonialIndex((prev) => (prev + 1) % testimonials.length)
                  }
                  className="w-8 h-8 rounded-full bg-white border border-[#E6E0D4] hover:bg-[#F3EFE6] text-[#16382B] flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <blockquote className="font-serif text-xl sm:text-2xl font-bold text-[#16382B] leading-snug">
              &quot;{testimonials[activeTestimonialIndex].quote}&quot;
            </blockquote>

            <div className="flex items-center justify-between pt-4 border-t border-[#ECE7DE]">
              <div>
                <p className="font-bold text-xs text-[#16382B]">{testimonials[activeTestimonialIndex].author}</p>
                <p className="text-[11px] text-stone-500">{testimonials[activeTestimonialIndex].role}</p>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <p className="font-serif text-xl font-extrabold text-[#16382B]">{testimonials[activeTestimonialIndex].stat1}</p>
                  <p className="text-[10px] text-stone-500">{testimonials[activeTestimonialIndex].stat1Label}</p>
                </div>
                <div>
                  <p className="font-serif text-xl font-extrabold text-emerald-700">{testimonials[activeTestimonialIndex].stat2}</p>
                  <p className="text-[10px] text-stone-500">{testimonials[activeTestimonialIndex].stat2Label}</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. TRANSPARENT PRICING MATRIX (PAYSTACK ZMW / USD) */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-20 bg-[#FBF9F5] border-t border-[#ECE7DE]">
        <div className="max-w-7xl mx-auto px-6">
          <PricingMatrix />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. INSTITUTIONAL SECURITY, LANDS ACT & POPIA ACCORDION */}
      {/* ========================================================================= */}
      <section id="compliance" className="py-20 bg-white border-t border-[#ECE7DE]">
        <div className="max-w-5xl mx-auto px-6">
          <PopiaFaqAccordion />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. LUXURY EDITORIAL FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-[#16382B] text-white pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
        <ContourTopoBackground opacity={0.1} strokeColor="#E8C265" withGrid={true} />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Col 1: Brand */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8C265] text-[#16382B] flex items-center justify-center font-serif font-bold text-base shadow-sm">
                  C
                </div>
                <span className="font-serif font-bold text-xl tracking-tight text-white">
                  CONTOUR
                </span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                The Real Estate Operations & Mandate Operating System for Southern Africa. Built by Banya Labs.
              </p>
              <div className="text-[11px] font-mono text-stone-400">
                <p>Lusaka, Zambia</p>
                <p>support@contour.co.zm</p>
              </div>
            </div>

            {/* Col 2: Surfaces */}
            <div className="space-y-3 text-xs">
              <h4 className="font-serif font-bold text-sm text-[#E8C265]">Application Surfaces</h4>
              <ul className="space-y-2 text-stone-300">
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">Operations Dashboard</Link>
                </li>
                <li>
                  <Link href="/dashboard/properties" className="hover:text-white transition-colors">Properties Catalogue</Link>
                </li>
                <li>
                  <Link href="/dashboard/map" className="hover:text-white transition-colors">Interactive Lusaka Map</Link>
                </li>
                <li>
                  <Link href="/kiosk" className="hover:text-white transition-colors">Field Companion (/kiosk)</Link>
                </li>
                <li>
                  <Link href="/dashboard/sales" className="hover:text-white transition-colors">Sales & Title Registry</Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Compliance & Legal */}
            <div className="space-y-3 text-xs">
              <h4 className="font-serif font-bold text-sm text-[#E8C265]">Legal & Integrity</h4>
              <ul className="space-y-2 text-stone-300">
                <li><span className="hover:text-white cursor-pointer">Zambian Lands Act Compliance</span></li>
                <li><span className="hover:text-white cursor-pointer">POPIA & FICA Data Sovereignty</span></li>
                <li><span className="hover:text-white cursor-pointer">AES-256 Title Deeds Vault</span></li>
                <li><span className="hover:text-white cursor-pointer">The DocuSign Human Approval Seam</span></li>
                <li><span className="hover:text-white cursor-pointer">30-Day Anti-Poaching Lock</span></li>
              </ul>
            </div>

            {/* Col 4: Fast Dev Login */}
            <div className="space-y-3 text-xs">
              <h4 className="font-serif font-bold text-sm text-[#E8C265]">Developer Access</h4>
              <p className="text-stone-300 text-xs leading-relaxed">
                Test all 5 surfaces with simulated Super Admin credentials.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E8C265] font-bold border border-white/20 transition-all"
              >
                <span>Fast Dev Bypass</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
            <p>© 2026 Contour. A Banya Labs venture. All rights reserved.</p>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>Powered by PowerSync SQLite WASM</span>
              <span>•</span>
              <span>Paystack Verified</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
