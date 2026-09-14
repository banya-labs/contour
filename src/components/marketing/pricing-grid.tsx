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

  const features = [
    { name: "Up to 50 active listings", starter: true, growth: true, enterprise: true },
    { name: "20 managed rental units", starter: true, growth: true, enterprise: true },
    { name: "Interactive Lusaka Leaflet property map", starter: true, growth: true, enterprise: true },
    { name: "1-Click WhatsApp listing flyer generator", starter: true, growth: true, enterprise: true },
    { name: "30-Day anti-poaching client registration", starter: true, growth: true, enterprise: true },
    { name: "Public shareable property cards (/p/[slug])", starter: true, growth: true, enterprise: true },
    { name: "Lenco Mobile Money (MTN, Airtel, Zamtel) & Card billing", starter: true, growth: true, enterprise: true },
    { name: "Up to 250 active listings & 100 rental units", starter: false, growth: true, enterprise: true },
    { name: "True 5% Commission & Agent Split Ledger", starter: false, growth: true, enterprise: true },
    { name: "1-Click Landlord Remittance Statements", starter: false, growth: true, enterprise: true },
    { name: "The DocuSign Human Approval Seam", starter: false, growth: true, enterprise: true },
    { name: "PowerSync Offline-First Field PWA (/kiosk)", starter: false, growth: true, enterprise: true },
    { name: "Public REST API for Corporate Website listings", starter: false, growth: true, enterprise: true },
    { name: "Reverse Matchmaker buyer-to-property AI alerts", starter: false, growth: true, enterprise: true },
    { name: "Unlimited listings, agents & rental units", starter: false, growth: false, enterprise: true },
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

      {/* Pricing Columns Framed in 1400px Container */}
      <div className="w-full border-t border-b border-editorial-border bg-white">
        <div className="max-w-[1400px] mx-auto border-x border-editorial-border">
          {/* Tier Headers (Starter / Agency / Enterprise) */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-editorial-border">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 sm:p-10 flex flex-col justify-between relative ${
                  plan.isAgency ? "bg-editorial-black text-white" : "bg-white text-editorial-black"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 min-h-[24px]">
                    {plan.isAgency ? (
                      <span className="font-geist text-[11px] font-bold tracking-widest text-editorial-red uppercase">
                        MOST POPULAR
                      </span>
                    ) : (
                      <span className="font-geist text-[11px] font-medium tracking-widest text-editorial-muted uppercase">
                        {plan.name}
                      </span>
                    )}
                  </div>

                  <div className="font-heading font-bold text-3xl sm:text-5xl lg:text-6xl tracking-tight flex items-baseline gap-1">
                    <span>{currency === "ZMW" ? plan.priceZMW : plan.priceUSD}</span>
                    <span className={`font-geist text-xs sm:text-base font-normal ${plan.isAgency ? "text-neutral-400" : "text-editorial-muted"}`}>
                      {plan.period}
                    </span>
                  </div>

                  <p className={`mt-2 sm:mt-3 font-geist text-xs sm:text-sm leading-relaxed ${
                    plan.isAgency ? "text-neutral-300" : "text-editorial-muted"
                  }`}>
                    {plan.tagline}
                  </p>
                </div>

                <div className="mt-6 sm:mt-8 pt-4">
                  {plan.isAgency ? (
                    <Link
                      href={plan.href}
                      className="btn-fill-wipe-white w-full py-3.5 sm:py-4 bg-editorial-red text-white font-heading font-bold text-xs sm:text-sm tracking-wide text-center block"
                    >
                      <span>{plan.cta}</span>
                    </Link>
                  ) : (
                    <Link
                      href={plan.href}
                      className="btn-fill-wipe-dark w-full py-3.5 sm:py-4 border border-editorial-black bg-transparent text-editorial-black font-heading font-semibold text-xs sm:text-sm tracking-wide text-center block"
                    >
                      <span>{plan.cta}</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table Rows Framed in 1400px Grid */}
          <div className="divide-y divide-editorial-border bg-white border-t border-editorial-border">
            <div className="hidden md:grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] px-6 sm:px-10 py-3 bg-neutral-50/70 font-geist text-[11px] font-bold text-editorial-muted uppercase tracking-wider">
              <div aria-hidden="true" />
              <div className="text-center">Starter Broker</div>
              <div className="text-center bg-neutral-100/70 -my-3 py-3 border-x border-editorial-border">Growth Agency</div>
              <div className="text-center">Enterprise Brokerage</div>
            </div>

            {features.map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] px-4 sm:px-10 py-3 sm:py-4 font-geist text-xs sm:text-sm items-center hover:bg-editorial-hover/40 transition-colors"
              >
                <div className="font-medium text-editorial-black mb-1 md:mb-0">
                  {row.name}
                </div>
                <div className="text-left md:text-center text-editorial-muted pt-1 md:pt-0">
                  <span className="md:hidden text-[10px] uppercase mr-1">Starter:</span>
                  {row.starter ? <span className="text-editorial-black font-bold">✓</span> : <span className="text-neutral-300">—</span>}
                </div>
                <div className="text-left md:text-center font-bold text-editorial-black md:bg-neutral-50/80 md:-my-4 md:py-4 md:border-x md:border-editorial-border pt-1 md:pt-0">
                  <span className="md:hidden text-[10px] uppercase mr-1">Growth Agency:</span>
                  {row.growth ? <span className="text-editorial-red font-bold text-base">✓</span> : <span className="text-neutral-300">—</span>}
                </div>
                <div className="text-left md:text-center text-editorial-muted pt-1 md:pt-0">
                  <span className="md:hidden text-[10px] uppercase mr-1">Enterprise Brokerage:</span>
                  {row.enterprise ? <span className="text-editorial-black font-bold">✓</span> : <span className="text-neutral-300">—</span>}
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
