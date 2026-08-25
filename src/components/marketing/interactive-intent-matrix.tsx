"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building2, TrendingUp } from "lucide-react";

export function InteractiveIntentMatrix() {
  const [activeIntent, setActiveIntent] = useState<"buy" | "sell" | "lease" | "develop">("buy");

  const intentData = {
    buy: {
      headline: "Buy Smarter with Vetted Local Intelligence",
      subhead:
        "Backed by Ministry of Lands legal custody, direct cadastral survey checks, and appraisal price verification — locked in before you view.",
      points: [
        "100% Verified Certificate of Title & PACRA company verification.",
        "Zoning & municipal utility infrastructure checks.",
        "Zero hidden dual-mandate broker inflation.",
      ],
      ctaText: "Explore Buying Mandates",
      ctaLink: "/dashboard",
      image: "/images/solidroad/asset_0_UG7DO77CykOXq0OIDltE.png",
      tag: "Buyer Protection",
    },
    sell: {
      headline: "Sell Fast and High with Verified Authority",
      subhead:
        "Your listing gets pre-staging, sovereign title escrow, WhatsApp catalog syndication, and private outreach to qualified diplomatic and institutional buyers.",
      points: [
        "Private syndication to 1,200+ verified Lusaka investors.",
        "Automated WhatsApp flyer generation with masked owner PII.",
        "30-day anti-poaching lock and escrow contract protection.",
      ],
      ctaText: "List Your Property",
      ctaLink: "/dashboard",
      image: "/images/solidroad/asset_28_mFBjbn51LwCjG5D3RgYP.png",
      tag: "Seller Mandate",
    },
    lease: {
      headline: "Diplomatic & Executive Tenancy Management",
      subhead:
        "Access hidden embassy rentals before they hit open portals. Automated WhatsApp rent collection with 4-day cooldown arrears nudges.",
      points: [
        "Diplomatic standard lease agreements with human legal review.",
        "Automated WhatsApp rent nudges and maintenance logging.",
        "Zero-latency field check-in/check-out condition reports.",
      ],
      ctaText: "Browse Executive Leases",
      ctaLink: "/dashboard",
      image: "/images/solidroad/asset_33_qq46LRopVAERA1djCvgl.png",
      tag: "Leasing & Management",
    },
    develop: {
      headline: "Commercial Acreage & Subdivision Parcels",
      subhead:
        "High-growth development corridors along Leopards Hill, Great East Road, and Kafue Road with verified beacons and environmental clearances.",
      points: [
        "Beacon coordinate verification & topography mapping.",
        "ZEMA environmental and council planning compliance.",
        "Joint venture structuring with institutional developers.",
      ],
      ctaText: "View Development Land",
      ctaLink: "/dashboard",
      image: "/images/solidroad/asset_38_lRau233hnNDJEhOiUyWJ.png",
      tag: "Commercial Land",
    },
  };

  const current = intentData[activeIntent];

  return (
    <section id="intent" className="py-24 bg-[#0A0E0C] text-white overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#E57A1A]/10 blur-3xl rounded-full pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-900/15 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-white/10">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#E57A1A] font-bold">
              Tailored Execution
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-white mt-2">
              How CONTOUR Can Help You
            </h2>
          </div>
          <p className="text-stone-400 text-xs sm:text-sm max-w-md mt-4 md:mt-0 font-medium">
            Hover or click to experience tailored workflows for buyers, sellers, landlords, and commercial developers.
          </p>
        </div>

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Panel: Dynamic Content Presentation */}
          <div className="lg:col-span-6 bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-10 backdrop-blur-xl relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E57A1A]/20 border border-[#E57A1A]/40 text-[#E57A1A] text-[11px] font-mono font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3 h-3" />
              <span>{current.tag}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-4 leading-tight">
              {current.headline}
            </h3>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-8">
              {current.subhead}
            </p>

            <div className="space-y-3.5 mb-8">
              {current.points.map((pt, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-stone-200">
                  <CheckCircle2 className="w-4 h-4 text-[#E57A1A] shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>

            <Link
              href={current.ctaLink}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FAF8F5] text-[#141715] hover:bg-white text-xs font-bold transition-all shadow-lg group"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Right Panel: Giant Kinetic Typography Tabs */}
          <div className="lg:col-span-6 flex flex-col space-y-4 sm:space-y-6">
            {(["buy", "sell", "lease", "develop"] as const).map((intentKey) => {
              const isActive = activeIntent === intentKey;
              const labels = {
                buy: "Buy",
                sell: "Sell",
                lease: "Lease",
                develop: "Develop",
              };

              return (
                <button
                  key={intentKey}
                  onMouseEnter={() => setActiveIntent(intentKey)}
                  onClick={() => setActiveIntent(intentKey)}
                  className={`w-full text-left py-6 px-8 rounded-3xl transition-all duration-300 flex items-center justify-between group border ${
                    isActive
                      ? "bg-white/10 border-white/30 translate-x-2 text-white shadow-2xl"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.06] text-stone-500 hover:text-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <span
                      className={`text-xs font-mono font-bold transition-colors ${
                        isActive ? "text-[#E57A1A]" : "text-stone-600"
                      }`}
                    >
                      {intentKey === "buy" && "01"}
                      {intentKey === "sell" && "02"}
                      {intentKey === "lease" && "03"}
                      {intentKey === "develop" && "04"}
                    </span>
                    <span className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight">
                      {labels[intentKey]}
                    </span>
                  </div>

                  <ArrowRight
                    className={`w-8 h-8 sm:w-10 sm:h-10 transition-all duration-300 ${
                      isActive
                        ? "text-white translate-x-0 opacity-100"
                        : "text-stone-600 -translate-x-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
