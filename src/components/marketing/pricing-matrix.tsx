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
    <section className="py-20 bg-paper-100 border-b border-border" id="pricing">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-200 border border-border text-ink-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <CreditCard className="w-3.5 h-3.5 text-contour-red" />
            Predictable Investment
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            Simple, Transparent Regional Pricing
          </h2>
          <p className="text-sm sm:text-base text-ink-600 mt-3 leading-relaxed">
            Priced for Southern African brokerages with seamless Paystack checkout. Pay in Zambian Kwacha (ZMW) or US Dollars (USD) via MTN MoMo, Airtel Money, Zamtel, or Visa/Mastercard.
          </p>

          {/* Billing & Currency Toggles */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            {/* Monthly / Annual Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-paper-200 border border-border">
              <button
                type="button"
                onClick={() => setBillingCycle("MONTHLY")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  billingCycle === "MONTHLY"
                    ? "bg-contour-dark text-white shadow-subtle"
                    : "text-ink-700 hover:text-ink-950"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("ANNUAL")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === "ANNUAL"
                    ? "bg-contour-dark text-white shadow-subtle"
                    : "text-ink-700 hover:text-ink-950"
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.2 rounded bg-contour-emerald text-white text-[10px] font-bold">
                  Save 20%
                </span>
              </button>
            </div>

            {/* Currency Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-paper-200 border border-border">
              <button
                type="button"
                onClick={() => setCurrency("ZMW")}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  currency === "ZMW"
                    ? "bg-contour-red text-white shadow-subtle"
                    : "text-ink-700 hover:text-ink-950"
                }`}
              >
                ZMW (Kwacha)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  currency === "USD"
                    ? "bg-contour-red text-white shadow-subtle"
                    : "text-ink-700 hover:text-ink-950"
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-14">
          {plans.map((plan) => {
            const price =
              currency === "ZMW"
                ? billingCycle === "MONTHLY"
                  ? plan.monthlyZmw
                  : plan.annualZmw
                : billingCycle === "MONTHLY"
                ? plan.monthlyUsd
                : plan.annualUsd;

            const prefix = currency === "ZMW" ? "K" : "$";

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-7 border flex flex-col justify-between transition-all relative ${
                  plan.popular
                    ? "bg-white border-2 border-contour-red shadow-floating md:-translate-y-2"
                    : "bg-white border-border shadow-card hover:border-ink-400"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-contour-red text-white text-[11px] font-bold px-3.5 py-0.5 rounded-full uppercase tracking-wider shadow-subtle">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-serif text-xl font-bold text-ink-900">{plan.name}</h3>
                    {!plan.popular && (
                      <span className="text-[10px] font-mono uppercase bg-paper-200 text-ink-600 px-2 py-0.5 rounded">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-600 mb-6">{plan.description}</p>

                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-4xl font-bold text-ink-900">
                        {prefix} {price.toLocaleString()}
                      </span>
                      <span className="text-xs text-ink-600 font-medium"> / month</span>
                    </div>
                    <div className="text-[11px] text-ink-500 font-mono mt-1">
                      {billingCycle === "ANNUAL" ? "Billed annually (20% off)" : "Billed monthly"}
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs text-ink-800 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-contour-emerald shrink-0 mt-0.5" />
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/dashboard"
                  className={`w-full py-3 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-subtle ${
                    plan.popular
                      ? "bg-contour-red hover:bg-contour-red/90 text-white"
                      : "bg-paper-200 hover:bg-paper-300 text-ink-900"
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Paystack Payment Channels Banner */}
        <div className="bg-paper-200/80 rounded-2xl p-6 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-contour-emerald shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-ink-900">
                Official Paystack Gateway Integration
              </div>
              <div className="text-ink-600 text-[11px]">
                Accepting MTN Mobile Money, Airtel Money, Zamtel Kwacha, Visa, Mastercard & Bank EFT.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-ink-600 bg-white px-3 py-1.5 rounded-lg border border-border">
            <span>256-Bit SSL</span>
            <span>•</span>
            <span>Instant VAT Invoices</span>
          </div>
        </div>
      </div>
    </section>
  );
}
