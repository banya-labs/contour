"use client";

import React from "react";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { ContourNavbar } from "@/components/marketing/contour-navbar";
import { HeroStage } from "@/components/marketing/hero-stage";
import { ProductFeatures } from "@/components/marketing/product-features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { CtaFooter } from "@/components/marketing/cta-footer";

export default function HomePage() {
  return (
    <LenisProvider>
      <main className="min-h-screen bg-white text-editorial-black font-geist antialiased selection:bg-editorial-red selection:text-white">
        {/* 1. Fixed Architectural Navigation */}
        <ContourNavbar />

        {/* 2. Full-Bleed 16:9 Hero Stage with Zambian Sunrise Animation */}
        <HeroStage />

        {/* 3. The System / Product Feature Matrix with Architectural Blueprint Previews */}
        <ProductFeatures />

        {/* 4. How It Works: Interactive Workflow Engine (SELL / RENT / LEASE / DEVELOP) */}
        <HowItWorks />

        {/* 5. Commercial Pricing Matrix with Inverted Agency Hero Tier */}
        <PricingGrid />

        {/* 6. Closing CTA Statement, Sunset Bookend & Monolithic Editorial Footer */}
        <CtaFooter />
      </main>
    </LenisProvider>
  );
}
