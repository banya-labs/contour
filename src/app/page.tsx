"use client";

import React from "react";
import { LuxuryNavbar } from "@/components/marketing/luxury-navbar";
import { LuxuryHeroStage } from "@/components/marketing/luxury-hero-stage";
import { EditorialManifestoGallery } from "@/components/marketing/editorial-manifesto-gallery";
import { InteractiveIntentMatrix } from "@/components/marketing/interactive-intent-matrix";
import { CuratedServicesBento } from "@/components/marketing/curated-services-bento";
import { MapDemoPreview } from "@/components/marketing/map-demo-preview";
import { EditorialTestimonialCard } from "@/components/marketing/editorial-testimonial-card";
import { EditorialMarketNotes } from "@/components/marketing/editorial-market-notes";
import { MonolithicFooter } from "@/components/marketing/monolithic-footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#141715] font-sans antialiased selection:bg-[#E57A1A] selection:text-white">
      {/* 1. Glassmorphic Navigation Bar */}
      <LuxuryNavbar />

      {/* 2. Floating 3D Villa Hero Stage with Instant Search */}
      <LuxuryHeroStage />

      {/* 3. The Contour Manifesto & Asymmetrical Staggered Photo Grid */}
      <EditorialManifestoGallery />

      {/* 4. Kinetic Intent Switcher: "How CONTOUR Helps You" (Buy / Sell / Lease / Develop) */}
      <InteractiveIntentMatrix />

      {/* 5. Curated Services & Legal Custody Bento Grid */}
      <CuratedServicesBento />

      {/* 6. Interactive Lusaka Spatial Map & Neighborhood Coordinates */}
      <MapDemoPreview />

      {/* 7. Executive Testimonials & Commission Proof */}
      <EditorialTestimonialCard />

      {/* 8. Lusaka Market Intelligence & Editorial Notes */}
      <EditorialMarketNotes />

      {/* 9. Monolithic Typographic Footer & Conversion Engine */}
      <MonolithicFooter />
    </div>
  );
}
