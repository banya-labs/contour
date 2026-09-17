"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CornerMark } from "@/components/ui/corner-mark";
import { ease } from "@/lib/animation-variants";

export function PricingGrid() {
  const [currency, setCurrency] = useState<"ZMW" | "USD">("ZMW");

  const plans = [
    {
      id: "starter",
      name: "STARTER BROKER",
      priceZMW: "K 1,200",
      priceUSD: "$49",
      period: "/mo",
      tagline: "For boutique agencies & solo principals (1–3 agents)",
      isAgency: false,
      cta: "Start Free Trial →",
      href: "/sign-up",
    },
    {
      id: "growth",
      name: "GROWTH AGENCY",
      priceZMW: "K 3,200",
      priceUSD: "$129",
      period: "/mo",
      tagline: "For scaling mid-sized brokerages (4–15 agents)",
      isAgency: true,
      cta: "Start Free Trial →",
      href: "/sign-up",
    },
    {
      id: "enterprise",
      name: "ENTERPRISE BROKERAGE",
      priceZMW: "K 7,500",
      priceUSD: "$299",
      period: "/mo",
      tagline: "For multi-branch firms & commercial developers",
      isAgency: false,
      cta: "Contact Sales →",
      href: "#contact",
    },
  ];

  type FeatureRow = {
    name: string;
    starter: string | boolean;
    growth: string | boolean;
    enterprise: string | boolean;
  };

  const features: FeatureRow[] = [
    // Quotas & Capacities
    { name: "Active Listings Cap", starter: "Up to 50", growth: "Up to 250", enterprise: "Unlimited" },
    { name: "Managed Rental Units", starter: "20 units", growth: "100 units", enterprise: "Unlimited" },
    { name: "Agent Seat Licenses", starter: "1–3 agents", growth: "4–15 agents", enterprise: "Unlimited" },

    // Core Brokerage Operations
    { name: "Interactive Lusaka Leaflet property map", starter: true, growth: true, enterprise: true },
    { name: "1-Click WhatsApp listing flyer generator", starter: true, growth: true, enterprise: true },
    { name: "30-Day anti-poaching client registration", starter: true, growth: true, enterprise: true },
    { name: "Public shareable property cards (/p/[slug])", starter: true, growth: true, enterprise: true },
    { name: "Lenco Mobile Money (MTN, Airtel, Zamtel) & Cards", starter: true, growth: true, enterprise: true },

    // Growth Tier Automation
    { name: "True 5% Commission & Agent Split Ledger", starter: false, growth: true, enterprise: true },
    { name: "1-Click Landlord Remittance Statements", starter: false, growth: true, enterprise: true },
    { name: "The DocuSign Human Approval Seam", starter: false, growth: true, enterprise: true },
    { name: "Automated WhatsApp rent arrears nudges", starter: false, growth: true, enterprise: true },
    { name: "PowerSync Offline-First Field PWA (/kiosk)", starter: false, growth: true, enterprise: true },
    { name: "Public REST API for Corporate Website listings", starter: false, growth: true, enterprise: true },
    { name: "Reverse Matchmaker buyer-to-property AI alerts", starter: false, growth: true, enterprise: true },

    // Enterprise Tier Infrastructure
    { name: "Multi-branch RBAC (Lusaka, Ndola, Livingstone)", starter: false, growth: false, enterprise: true },
    { name: "Dedicated MinIO S3 object storage partition", starter: false, growth: false, enterprise: true },
    { name: "Full JSON-RPC 2.0 /api/mcp AI agent tools", starter: false, growth: false, enterprise: true },
    { name: "Unlimited public API keys & custom webhooks", starter: false, growth: false, enterprise: true },
    { name: "Dedicated SLA & technical account architect", starter: false, growth: false, enterprise: true },
  ];

  return (
    <section id="pricing" className="relative w-full bg-white overflow-hidden">
      <CornerMark position="top-left" className="top-2 left-2" />
      <CornerMark position="top-right" className="top-2 right-2" />

      {/* Header Bar: "THE PRICING" */}
      <div className="w-full border-t border-b border-editorial-border py-3 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-center gap-6">
          <div className="flex-1 h-px bg-editorial-border" />
          <span className="font-geist text-xs font-semibold uppercase tracking-[0.25em] text-editorial-muted whitespace-nowrap">
            THE PRICING
          </span>
          <div className="flex-1 h-px bg-editorial-border" />
        </div>
      </div>

      {/* Headline & Currency Switcher Framed in 1400px Container */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16 text-center border-x border-editorial-border">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="font-heading font-bold text-4xl sm:text-5xl lg:text-7xl tracking-tighter text-editorial-black uppercase leading-[0.98] [text-wrap:balance]"
        >
          PRICED FOR THE <br />
          AFRICAN MARKET.
        </motion.h2>

        {/* Currency Switcher */}
        <div className="mt-8 flex items-center justify-center gap-3 font-geist text-xs">
          <div className="border border-editorial-black p-0.5 flex">
            <button
              onClick={() => setCurrency("ZMW")}
              className={`px-4 py-1.5 font-bold transition-colors ${
                currency === "ZMW"
                  ? "bg-editorial-black text-white"
                  : "bg-transparent text-editorial-black hover:bg-neutral-100"
              }`}
            >
              ZMW
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-4 py-1.5 font-bold transition-colors ${
                currency === "USD"
                  ? "bg-editorial-black text-white"
                  : "bg-transparent text-editorial-black hover:bg-neutral-100"
              }`}
            >
              USD
            </button>
          </div>
          <span className="text-editorial-muted">Toggle currency</span>
        </div>
      </div>

      {/* Unified 4-Column Pricing & Comparison Grid Framed in 1400px Container */}
      <div className="w-full border-t border-b border-editorial-border bg-white overflow-x-auto">
        <div className="max-w-[1400px] min-w-[820px] mx-auto border-x border-editorial-border">
          {/* Top Row: Capabilities Overview Cell + 3 Pricing Cards */}
          <div className="grid grid-cols-4 border-b border-editorial-border">
            {/* Col 1: Capabilities Framing Header */}
            <div className="p-6 sm:p-8 flex flex-col justify-between border-r border-editorial-border bg-neutral-50/40">
              <div>
                <span className="font-geist text-[11px] font-bold tracking-widest text-editorial-muted uppercase">
                  PLANS & CAPACITIES
                </span>
                <p className="mt-3 font-geist text-xs text-editorial-muted leading-relaxed">
                  Tailored for Zambian brokerages. Transparent commission ledgers, zero lock-in contracts.
                </p>
              </div>
              <div className="pt-4 font-geist text-[11px] text-editorial-muted uppercase tracking-wider">
                Full Feature Matrix ↓
              </div>
            </div>

            {/* Col 2: Starter Broker */}
            <div className="p-6 sm:p-8 flex flex-col justify-between relative bg-white text-editorial-black border-r border-editorial-border">
              <div>
                <div className="mb-3 min-h-[34px] flex flex-col justify-end">
                  <span className="font-geist text-[11px] font-bold tracking-widest text-editorial-muted uppercase">
                    STARTER BROKER
                  </span>
                </div>

                <div className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight flex items-baseline gap-1">
                  <span>{currency === "ZMW" ? plans[0].priceZMW : plans[0].priceUSD}</span>
                  <span className="font-geist text-xs sm:text-sm font-normal text-editorial-muted">
                    {plans[0].period}
                  </span>
                </div>

                <p className="mt-2 sm:mt-3 font-geist text-xs sm:text-sm leading-relaxed text-editorial-muted">
                  {plans[0].tagline}
                </p>
              </div>

              <div className="mt-6 sm:mt-8 pt-4">
                <Link
                  href={plans[0].href}
                  className="btn-fill-wipe-dark w-full py-3.5 border border-editorial-black bg-transparent text-editorial-black font-heading font-semibold text-xs sm:text-sm tracking-wide text-center block"
                >
                  <span>{plans[0].cta}</span>
                </Link>
              </div>
            </div>

            {/* Col 3: Growth Agency (Active / Black Accent Column) */}
            <div className="p-6 sm:p-8 flex flex-col justify-between relative bg-editorial-black text-white border-r border-neutral-800">
              <div>
                <div className="mb-3 min-h-[34px] flex flex-col justify-end">
                  <span className="font-geist text-[10px] font-bold tracking-widest text-editorial-red uppercase">
                    MOST POPULAR
                  </span>
                  <span className="font-geist text-[11px] font-bold tracking-widest text-white uppercase">
                    GROWTH AGENCY
                  </span>
                </div>

                <div className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight flex items-baseline gap-1">
                  <span>{currency === "ZMW" ? plans[1].priceZMW : plans[1].priceUSD}</span>
                  <span className="font-geist text-xs sm:text-sm font-normal text-neutral-400">
                    {plans[1].period}
                  </span>
                </div>

                <p className="mt-2 sm:mt-3 font-geist text-xs sm:text-sm leading-relaxed text-neutral-300">
                  {plans[1].tagline}
                </p>
              </div>

              <div className="mt-6 sm:mt-8 pt-4">
                <Link
                  href={plans[1].href}
                  className="btn-fill-wipe-white w-full py-3.5 bg-editorial-red text-white font-heading font-bold text-xs sm:text-sm tracking-wide text-center block"
                >
                  <span>{plans[1].cta}</span>
                </Link>
              </div>
            </div>

            {/* Col 4: Enterprise Brokerage */}
            <div className="p-6 sm:p-8 flex flex-col justify-between relative bg-white text-editorial-black">
              <div>
                <div className="mb-3 min-h-[34px] flex flex-col justify-end">
                  <span className="font-geist text-[11px] font-bold tracking-widest text-editorial-muted uppercase">
                    ENTERPRISE BROKERAGE
                  </span>
                </div>

                <div className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight flex items-baseline gap-1">
                  <span>{currency === "ZMW" ? plans[2].priceZMW : plans[2].priceUSD}</span>
                  <span className="font-geist text-xs sm:text-sm font-normal text-editorial-muted">
                    {plans[2].period}
                  </span>
                </div>

                <p className="mt-2 sm:mt-3 font-geist text-xs sm:text-sm leading-relaxed text-editorial-muted">
                  {plans[2].tagline}
                </p>
              </div>

              <div className="mt-6 sm:mt-8 pt-4">
                <Link
                  href={plans[2].href}
                  className="btn-fill-wipe-dark w-full py-3.5 border border-editorial-black bg-transparent text-editorial-black font-heading font-semibold text-xs sm:text-sm tracking-wide text-center block"
                >
                  <span>{plans[2].cta}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Table Header Row */}
          <div className="grid grid-cols-4 bg-neutral-50/80 border-b border-editorial-border font-geist text-[11px] font-bold uppercase tracking-wider text-editorial-muted">
            <div className="px-6 py-2.5 border-r border-editorial-border text-editorial-black">
              Feature Comparison
            </div>
            <div className="px-4 py-2.5 text-center border-r border-editorial-border">
              Starter Broker
            </div>
            <div className="px-4 py-2.5 text-center bg-neutral-900 text-white border-r border-neutral-800">
              Growth Agency
            </div>
            <div className="px-4 py-2.5 text-center">
              Enterprise Brokerage
            </div>
          </div>

          {/* Feature Matrix Rows: Perfectly Aligned 4-Column Grid */}
          <div className="divide-y divide-editorial-border">
            {features.map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-4 font-geist text-xs sm:text-sm items-center hover:bg-neutral-50/50 transition-colors"
              >
                {/* Col 1: Feature Name */}
                <div className="px-6 py-3 sm:py-3.5 font-medium text-editorial-black border-r border-editorial-border">
                  {row.name}
                </div>

                {/* Col 2: Starter Broker Value */}
                <div className="px-4 py-3 sm:py-3.5 text-center border-r border-editorial-border">
                  {typeof row.starter === "string" ? (
                    <span className="font-mono font-semibold text-xs text-editorial-black">
                      {row.starter}
                    </span>
                  ) : row.starter ? (
                    <span className="text-editorial-black font-bold text-sm">✓</span>
                  ) : (
                    <span className="text-neutral-300">—</span>
                  )}
                </div>

                {/* Col 3: Growth Agency Value (Dark Background Continuous Column) */}
                <div className="px-4 py-3 sm:py-3.5 text-center bg-editorial-black text-white border-r border-neutral-800">
                  {typeof row.growth === "string" ? (
                    <span className="font-mono font-semibold text-xs text-white">
                      {row.growth}
                    </span>
                  ) : row.growth ? (
                    <span className="text-editorial-red font-bold text-base">✓</span>
                  ) : (
                    <span className="text-neutral-600">—</span>
                  )}
                </div>

                {/* Col 4: Enterprise Brokerage Value */}
                <div className="px-4 py-3 sm:py-3.5 text-center">
                  {typeof row.enterprise === "string" ? (
                    <span className="font-mono font-semibold text-xs text-editorial-black">
                      {row.enterprise}
                    </span>
                  ) : row.enterprise ? (
                    <span className="text-editorial-black font-bold text-sm">✓</span>
                  ) : (
                    <span className="text-neutral-300">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lenco Zambia Badge & Guarantee Framed in 1400px Grid */}
      <div className="w-full border-b border-editorial-border bg-white">
        <div className="max-w-[1400px] mx-auto py-8 text-center space-y-2 border-x border-editorial-border">
          <div className="inline-flex items-center gap-2 border border-editorial-border px-4 py-1.5 font-geist text-xs text-editorial-black">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Powered by <strong>Lenco Zambia</strong> · Cards & Mobile Money</span>
          </div>
          <p className="font-geist text-xs text-editorial-muted max-w-xl mx-auto px-4">
            Prices in Zambian Kwacha (ZMW). USD equivalent shown on toggle. All plans include 14-day free trial. No credit card required.
          </p>
        </div>
      </div>

      <CornerMark position="bottom-left" className="bottom-2 left-2" />
      <CornerMark position="bottom-right" className="bottom-2 right-2" />
    </section>
  );
}
