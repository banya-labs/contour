import React from "react";
import Link from "next/link";
import {
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  DollarSign,
  MessageSquare,
  Zap,
  Lock,
  Layers,
  ChevronRight,
  FileCheck,
  Building,
  LogIn,
} from "lucide-react";

import { RoiLeakCalculator } from "@/components/marketing/roi-leak-calculator";
import { FieldAgentPwaMockup } from "@/components/marketing/field-agent-pwa-mockup";
import { WhatsAppSyndicationShowcase } from "@/components/marketing/whatsapp-syndication-showcase";
import { MapDemoPreview } from "@/components/marketing/map-demo-preview";
import { PricingMatrix } from "@/components/marketing/pricing-matrix";
import { PopiaFaqAccordion } from "@/components/marketing/popia-faq-accordion";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper-100 text-ink-900 font-sans selection:bg-contour-red/10 selection:text-contour-red">
      {/* Top Regional Reality Banner */}
      <div className="bg-paper-200 border-b border-border py-2 px-4 text-center text-xs font-semibold tracking-wide text-ink-800">
        <span className="inline-flex items-center gap-1.5">
          <span>🇿🇲</span>
          <span>BUILT FOR REAL ESTATE BROKERAGES IN SOUTHERN AFRICA • DUAL-CURRENCY ZMW & USD READY</span>
        </span>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-paper-100/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-contour-red flex items-center justify-center text-white font-serif font-bold text-xl shadow-subtle">
                C
              </div>
              <span className="font-serif font-bold text-xl tracking-tight text-ink-900">
                CONTOUR
              </span>
            </Link>
            <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-paper-200 text-ink-600 text-[10px] font-bold font-mono">
              v2.0 • Lusaka OS
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-ink-700">
            <a href="#leaks" className="hover:text-contour-red transition-colors">
              The 3 Leaks
            </a>
            <a href="#calculator" className="hover:text-contour-red transition-colors">
              ROI Calculator
            </a>
            <a href="#pwa-showcase" className="hover:text-contour-red transition-colors">
              Field PWA
            </a>
            <a href="#syndication" className="hover:text-contour-red transition-colors">
              WhatsApp Flyer
            </a>
            <a href="#map-preview" className="hover:text-contour-red transition-colors">
              Live Map
            </a>
            <a href="#pricing" className="hover:text-contour-red transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-contour-red transition-colors">
              Compliance
            </a>
          </nav>

          {/* Header Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-ink-700 hover:text-contour-red hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-paper-200 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Fast Dev Login</span>
            </Link>

            <Link
              href="/dashboard/map"
              className="text-xs font-semibold text-ink-800 hover:text-contour-red hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-paper-200 border border-border transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-contour-red" />
              <span>Live Map Demo</span>
            </Link>

            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-full bg-contour-dark hover:bg-ink-950 text-white text-xs font-semibold transition-all active:scale-95 shadow-subtle flex items-center gap-1.5"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: HERO SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-paper-200 border border-border text-ink-800 text-xs font-medium mb-6 shadow-card">
          <Sparkles className="w-3.5 h-3.5 text-contour-red" />
          <span>The Real Estate Agency Operating System for Lusaka & Southern Africa</span>
        </div>

        {/* H1 Main Headline */}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 leading-[1.12] mb-6 max-w-4xl mx-auto">
          Stop Losing Commissions in WhatsApp Chats. Run Your Entire Agency From One Live Command Center.
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-ink-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          From Kabulonga residential sales to Leopards Hill diplomatic leases: track true 5% agency commissions, eliminate month-end landlord remittance chaos, and equip field agents with zero-latency offline tools that work even during 8-hour ZESCO load-shedding.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-14">
          <Link
            href="/dashboard"
            className="px-7 py-3.5 rounded-full bg-contour-red hover:bg-contour-red/90 text-white text-sm font-semibold transition-all shadow-floating hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
          >
            <span>Start 14-Day Free Pilot</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/dashboard/map"
            className="px-7 py-3.5 rounded-full bg-white hover:bg-paper-200 text-ink-900 border border-border text-sm font-semibold transition-all shadow-subtle flex items-center gap-2"
          >
            <MapPin className="w-4 h-4 text-contour-red" />
            <span>Explore Live Lusaka Map</span>
          </Link>

          <Link
            href="/login"
            className="px-5 py-3.5 rounded-full bg-paper-200 hover:bg-paper-300 text-ink-800 border border-border text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-contour-amber" />
            <span>Fast Dev Login</span>
          </Link>
        </div>

        {/* 5 Trust & Proof Highlights */}
        <div className="pt-8 border-t border-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-left">
          <div className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-border shadow-card">
            <CheckCircle2 className="w-4 h-4 text-contour-emerald shrink-0 mt-0.5" />
            <span className="text-[11px] font-semibold text-ink-800 leading-tight">
              Dual Currency (ZMW & USD)
            </span>
          </div>

          <div className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-border shadow-card">
            <CheckCircle2 className="w-4 h-4 text-contour-emerald shrink-0 mt-0.5" />
            <span className="text-[11px] font-semibold text-ink-800 leading-tight">
              True 5% Commission Intelligence
            </span>
          </div>

          <div className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-border shadow-card">
            <CheckCircle2 className="w-4 h-4 text-contour-emerald shrink-0 mt-0.5" />
            <span className="text-[11px] font-semibold text-ink-800 leading-tight">
              1-Click WhatsApp Listing Flyers
            </span>
          </div>

          <div className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-border shadow-card">
            <CheckCircle2 className="w-4 h-4 text-contour-emerald shrink-0 mt-0.5" />
            <span className="text-[11px] font-semibold text-ink-800 leading-tight">
              Offline-First (Load-Shedding)
            </span>
          </div>

          <div className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-border shadow-card col-span-2 sm:col-span-1">
            <CheckCircle2 className="w-4 h-4 text-contour-emerald shrink-0 mt-0.5" />
            <span className="text-[11px] font-semibold text-ink-800 leading-tight">
              Masked Landlord PII Protection
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THE LEAK AUDIT (THE 3 DEADLY AGENCY LEAKS) */}
      {/* ========================================================================= */}
      <section className="py-20 bg-paper-200/50 border-t border-border" id="leaks">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-300 border border-border text-ink-800 text-xs font-semibold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-contour-red" />
              Operational Diagnostic
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
              The 3 Deadly Leaks Draining Your Agency&apos;s Cashflow
            </h2>
            <p className="text-sm sm:text-base text-ink-600 mt-3 leading-relaxed">
              Generic CRMs were built for Silicon Valley software sales, not Lusaka property brokerages navigating WhatsApp groups, title registries, and manual rental remittances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Leak 1: Gross Value Illusion */}
            <div className="bg-white rounded-2xl p-7 border border-border shadow-card space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-contour-red/10 text-contour-red flex items-center justify-center mb-5">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-contour-red font-mono mb-1">
                  Leak 01 • Revenue Blindspots
                </div>
                <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">
                  The &quot;Gross Value&quot; Illusion
                </h3>
                <p className="text-xs text-ink-600 leading-relaxed mb-4">
                  <strong className="text-ink-800">The Symptom:</strong> Your pipeline shows K15,000,000 in active listings, but your agency bank account is dry at month-end.
                </p>
                <p className="text-xs text-ink-600 leading-relaxed">
                  <strong className="text-ink-800">The Root Cause:</strong> Generic software tracks gross asset valuation. It fails to isolate your earned 5% agency fee ($42,500 on an $850k plot), 50% closing agent splits, or Ministry of Lands transfer consent milestones.
                </p>
              </div>
              <div className="bg-paper-100 rounded-xl p-3 border border-border text-[11px] font-semibold text-contour-emerald flex items-center gap-2 mt-4">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Contour Fix: Real-time 5% earned fee ledger & split payouts.</span>
              </div>
            </div>

            {/* Leak 2: WhatsApp Black Hole */}
            <div className="bg-white rounded-2xl p-7 border border-border shadow-card space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-contour-amber/10 text-contour-amber flex items-center justify-center mb-5">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-contour-amber font-mono mb-1">
                  Leak 02 • Asset & Lead Chaos
                </div>
                <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">
                  The &quot;WhatsApp Black Hole&quot;
                </h3>
                <p className="text-xs text-ink-600 leading-relaxed mb-4">
                  <strong className="text-ink-800">The Symptom:</strong> 50+ photos trapped in agent camera rolls; buyer inquiries forgotten in personal chats; friction over stolen clients.
                </p>
                <p className="text-xs text-ink-600 leading-relaxed">
                  <strong className="text-ink-800">The Root Cause:</strong> When a high-intent diplomat calls, agents spend 3 hours locating details—only to find the property was rented last week. When an agent leaves, they walk away with your client book.
                </p>
              </div>
              <div className="bg-paper-100 rounded-xl p-3 border border-border text-[11px] font-semibold text-contour-emerald flex items-center gap-2 mt-4">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Contour Fix: 1-Click flyers & 30-Day Anti-Poaching Lock.</span>
              </div>
            </div>

            {/* Leak 3: Landlord Excel Nightmare */}
            <div className="bg-white rounded-2xl p-7 border border-border shadow-card space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-contour-red/10 text-contour-red flex items-center justify-center mb-5">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-contour-red font-mono mb-1">
                  Leak 03 • Month-End Friction
                </div>
                <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">
                  The Landlord Excel Nightmare
                </h3>
                <p className="text-xs text-ink-600 leading-relaxed mb-4">
                  <strong className="text-ink-800">The Symptom:</strong> Spending the first 7 days of every month manually compiling Excel sheets to deduct 10% fees and maintenance offsets.
                </p>
                <p className="text-xs text-ink-600 leading-relaxed">
                  <strong className="text-ink-800">The Root Cause:</strong> Manual calculation errors trigger furious landlord disputes over borehole repairs, solar inverter servicing, and delayed bank wires.
                </p>
              </div>
              <div className="bg-paper-100 rounded-xl p-3 border border-border text-[11px] font-semibold text-contour-emerald flex items-center gap-2 mt-4">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Contour Fix: 1-Click PDF remittances with DocuSign Seam.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: INTERACTIVE ROI / COMMISSION LEAK CALCULATOR */}
      {/* ========================================================================= */}
      <RoiLeakCalculator />

      {/* ========================================================================= */}
      {/* SECTION 4: FIELD AGENT PWA SHOWCASE (OFFLINE-FIRST) */}
      {/* ========================================================================= */}
      <FieldAgentPwaMockup />

      {/* ========================================================================= */}
      {/* SECTION 5: 1-CLICK WHATSAPP FLYER & PORTAL SYNDICATION */}
      {/* ========================================================================= */}
      <WhatsAppSyndicationShowcase />

      {/* ========================================================================= */}
      {/* SECTION 6: LUSAKA GEOSPATIAL MAP DEMO PREVIEW */}
      {/* ========================================================================= */}
      <MapDemoPreview />

      {/* ========================================================================= */}
      {/* SECTION 7: PAYSTACK DUAL-CURRENCY PRICING MATRIX */}
      {/* ========================================================================= */}
      <PricingMatrix />

      {/* ========================================================================= */}
      {/* SECTION 8: POPIA / FICA COMPLIANCE & ACCORDION FAQ */}
      {/* ========================================================================= */}
      <PopiaFaqAccordion />

      {/* ========================================================================= */}
      {/* FINAL CTA STRIP */}
      {/* ========================================================================= */}
      <section className="py-16 bg-contour-dark text-white text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-contour-amber" />
            <span>Ready to Eliminate Brokerage Friction?</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
            Run Your Real Estate Agency With Complete Clarity.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join forward-thinking brokerages in Lusaka, Harare, and Johannesburg managing listings, field agents, and landlord payouts on Contour.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-full bg-contour-red hover:bg-contour-red/90 text-white text-sm font-semibold transition-all shadow-floating flex items-center gap-2"
            >
              <span>Start 14-Day Free Pilot</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/map"
              className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-contour-amber" />
              <span>Explore Live Map</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-paper-100 border-t border-border py-12 text-xs text-ink-600">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-contour-red flex items-center justify-center text-white font-serif font-bold text-sm">
                  C
                </div>
                <span className="font-serif font-bold text-lg text-ink-900">
                  CONTOUR
                </span>
              </div>
              <p className="text-xs text-ink-500 leading-relaxed">
                The Real Estate Operations & Field Agent Operating System for Lusaka & Southern Africa.
              </p>
              <div className="text-[11px] font-mono text-ink-400">
                A Banya Labs Vertical Software Venture.
              </div>
            </div>

            {/* Surfaces Column */}
            <div className="space-y-2">
              <div className="font-bold text-ink-900 uppercase tracking-wider text-[11px]">
                Platform Surfaces
              </div>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link href="/dashboard" className="hover:text-contour-red transition-colors">
                    Operations Dashboard (/dashboard)
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/map" className="hover:text-contour-red transition-colors">
                    Interactive Lusaka Map (/dashboard/map)
                  </Link>
                </li>
                <li>
                  <Link href="/kiosk" className="hover:text-contour-red transition-colors">
                    Field Agent PWA Kiosk (/kiosk)
                  </Link>
                </li>
                <li>
                  <Link href="/p/executive-4-bed-kabulonga" className="hover:text-contour-red transition-colors">
                    Public Shareable Property Card
                  </Link>
                </li>
                <li>
                  <Link href="/admin/mcp" className="hover:text-contour-red transition-colors">
                    Machine & MCP Hub (/admin/mcp)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Workflows Column */}
            <div className="space-y-2">
              <div className="font-bold text-ink-900 uppercase tracking-wider text-[11px]">
                Operational Features
              </div>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <a href="#calculator" className="hover:text-contour-red transition-colors">
                    5% Commission Leak Calculator
                  </a>
                </li>
                <li>
                  <a href="#pwa-showcase" className="hover:text-contour-red transition-colors">
                    PowerSync Offline-First Engine
                  </a>
                </li>
                <li>
                  <a href="#syndication" className="hover:text-contour-red transition-colors">
                    1-Click WhatsApp Flyers
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-contour-red transition-colors">
                    30-Day Anti-Poaching Lock
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-contour-red transition-colors">
                    Paystack ZMW/USD Subscriptions
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal & Compliance Column */}
            <div className="space-y-2">
              <div className="font-bold text-ink-900 uppercase tracking-wider text-[11px]">
                Data & Compliance
              </div>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <span className="text-ink-700">Zambian DPA Act No. 3 of 2021</span>
                </li>
                <li>
                  <span className="text-ink-700">South African POPIA / FICA Compliant</span>
                </li>
                <li>
                  <span className="text-ink-700">AES-256 Title Deed Vault Custody</span>
                </li>
                <li>
                  <span className="text-ink-700">The DocuSign Human Approval Seam</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-ink-500 text-[11px]">
            <div>
              © 2026 Contour. Built by Banya Labs. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:text-contour-red transition-colors">
                Fast Dev Login
              </Link>
              <span>•</span>
              <Link href="/dashboard/statements" className="hover:text-contour-red transition-colors">
                Landlord Statements
              </Link>
              <span>•</span>
              <Link href="/dashboard/documents" className="hover:text-contour-red transition-colors">
                Documents Vault
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
