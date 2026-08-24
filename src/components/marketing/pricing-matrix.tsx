"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Zap,
  Building,
  Check,
} from "lucide-react";

export function PricingMatrix() {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [currency, setCurrency] = useState<"ZMW" | "USD">("ZMW");

  const plans = [
    {
      id: "starter",
      name: "Starter Broker",
      badge: "Boutique & Solo",
      description: "For boutique agencies & solo principals (1–3 agents).",
      monthlyZmw: 1200,
      annualZmw: 960,
      monthlyUsd: 49,
      annualUsd: 39,
      features: [
        "Up to 50 active listings",
        "20 managed rental units",
        "Interactive Lusaka Leaflet property map",
        "1-Click WhatsApp listing flyer generator",
        "30-Day anti-poaching client registration",
        "Public shareable property cards (/p/[slug])",
        "Paystack Mobile Money & Card billing",
      ],
      ctaText: "Start 14-Day Free Pilot",
      popular: false,
    },
    {
      id: "growth",
      name: "Growth Agency",
      badge: "Most Popular ⭐",
      description: "For scaling mid-sized brokerages (4–15 agents).",
      monthlyZmw: 3200,
      annualZmw: 2560,
      monthlyUsd: 129,
      annualUsd: 99,
      features: [
        "Up to 250 active listings & 100 rental units",
        "True 5% Commission & Agent Split Ledger",
        "1-Click Landlord Remittance Statements",
        "The DocuSign Human Approval Seam",
        "PowerSync Offline-First Field PWA (/kiosk)",
        "Automated WhatsApp rent arrears bot",
        "Public REST API for Corporate Website listings",
        "Reverse Matchmaker buyer-to-property AI alerts",
      ],
      ctaText: "Start 14-Day Free Pilot",
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise Brokerage",
      badge: "Multi-Branch",
      description: "For multi-branch firms & commercial developers.",
      monthlyZmw: 7500,
      annualZmw: 6000,
      monthlyUsd: 299,
      annualUsd: 239,
      features: [
        "Unlimited listings, agents & rental units",
        "Multi-branch RBAC (Lusaka, Ndola, Livingstone)",
        "WhatsApp Voice note ingestion & transcription",
        "Custom domain & white-labeled Field PWA",
        "Dedicated MinIO S3 object storage partition",
        "Full JSON-RPC 2.0 /api/mcp AI agent tools",
        "Unlimited public API keys & custom webhooks",
        "Dedicated SLA & technical account architect",
      ],
      ctaText: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16382B]/10 border border-[#16382B]/15 text-[#16382B] text-xs font-semibold">
          <CreditCard className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span>PREDICTABLE SOUTHERN AFRICAN PRICING</span>
        </div>
        
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#16382B] tracking-tight">
          Transparent Investment. <br />
          <span className="text-[#C89B3C] italic font-serif font-normal">Zero Hidden Fees.</span>
        </h2>
        
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
          Priced for Southern African brokerages with seamless Paystack checkout. Pay in Zambian Kwacha (ZMW) or US Dollars (USD) via MTN MoMo, Airtel Money, Zamtel, or Visa/Mastercard.
        </p>

        {/* Billing & Currency Toggles */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          
          {/* Monthly / Annual Toggle */}
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-[#E6E0D4] shadow-xs">
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                billingCycle === "MONTHLY"
                  ? "bg-[#16382B] text-white shadow-sm font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("ANNUAL")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === "ANNUAL"
                  ? "bg-[#16382B] text-white shadow-sm font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#E8C265] text-[#16382B] text-[10px] font-bold">
                Save 20%
              </span>
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-[#E6E0D4] shadow-xs">
            <button
              type="button"
              onClick={() => setCurrency("ZMW")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                currency === "ZMW"
                  ? "bg-[#16382B] text-white shadow-sm font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              ZMW (Kwacha)
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                currency === "USD"
                  ? "bg-[#16382B] text-white shadow-sm font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              USD ($)
            </button>
          </div>

        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-7xl mx-auto">
        {plans.map((plan) => {
          const isGrowth = plan.popular;
          const displayPrice =
            currency === "ZMW"
              ? billingCycle === "MONTHLY"
                ? `K ${plan.monthlyZmw.toLocaleString()}`
                : `K ${plan.annualZmw.toLocaleString()}`
              : billingCycle === "MONTHLY"
              ? `$ ${plan.monthlyUsd}`
              : `$ ${plan.annualUsd}`;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                isGrowth
                  ? "bg-[#16382B] text-white shadow-2xl ring-2 ring-[#C89B3C] lg:-translate-y-2"
                  : "bg-white text-[#1C1C1A] border border-[#E6E0D4] shadow-sm hover:shadow-lg"
              }`}
            >
              {/* Popular Badge */}
              {isGrowth && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#E8C265] text-[#16382B] text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                  Most Popular For Mid-Sized Agencies
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3
                    className={`font-serif text-xl sm:text-2xl font-bold ${
                      isGrowth ? "text-white" : "text-[#16382B]"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isGrowth
                        ? "bg-white/15 text-[#E8C265]"
                        : "bg-[#FAF8F5] text-stone-600 border border-[#E6E0D4]"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <p
                  className={`text-xs leading-relaxed mb-6 ${
                    isGrowth ? "text-stone-300" : "text-stone-500"
                  }`}
                >
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-current/10">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${
                        isGrowth ? "text-[#E8C265]" : "text-[#16382B]"
                      }`}
                    >
                      {displayPrice}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isGrowth ? "text-stone-300" : "text-stone-500"
                      }`}
                    >
                      / month
                    </span>
                  </div>
                  {billingCycle === "ANNUAL" && (
                    <p
                      className={`text-[11px] mt-1 font-mono ${
                        isGrowth ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      Billed annually (2 months free)
                    </p>
                  )}
                </div>

                {/* Feature Checklist */}
                <div className="space-y-3 mb-8">
                  <p
                    className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
                      isGrowth ? "text-stone-300" : "text-stone-400"
                    }`}
                  >
                    Included Capabilities:
                  </p>
                  <ul className="space-y-2.5 text-xs">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isGrowth ? "text-[#E8C265]" : "text-[#16382B]"
                          }`}
                        />
                        <span
                          className={`leading-snug ${
                            isGrowth ? "text-stone-100" : "text-stone-700"
                          }`}
                        >
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Call to Action Button */}
              <div>
                <Link
                  href="/dashboard"
                  className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isGrowth
                      ? "bg-[#E8C265] hover:bg-[#F2D17F] text-[#16382B] shadow-md"
                      : "bg-[#16382B] hover:bg-[#0F291E] text-[#E8C265]"
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                
                <p
                  className={`text-[10px] text-center mt-2.5 ${
                    isGrowth ? "text-stone-400" : "text-stone-400"
                  }`}
                >
                  Instant setup • No card required for 14-day demo
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paystack Payment Channels Banner */}
      <div className="mt-12 p-6 rounded-3xl bg-white border border-[#E6E0D4] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
        <div className="space-y-1 text-center md:text-left">
          <p className="font-serif font-bold text-sm text-[#16382B]">
            Local & Regional Payment Methods Supported via Paystack
          </p>
          <p className="text-xs text-stone-500">
            MTN Mobile Money, Airtel Money, Zamtel Kwacha, Visa, Mastercard, and Bank EFT.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono font-semibold text-stone-700">
          <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4]">
            🟡 MTN MoMo
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4]">
            🔴 Airtel Money
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4]">
            🟢 Zamtel
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4]">
            💳 Visa / Mastercard
          </span>
        </div>
      </div>
    </div>
  );
}
