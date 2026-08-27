"use client";

import React, { useState } from "react";
import { LuxuryNavbar } from "@/components/marketing/luxury-navbar";
import { FilmScrollCanvas } from "@/components/marketing/film-scroll-canvas";
import { FilmScrollOverlays } from "@/components/marketing/film-scroll-overlays";
import { EditorialManifestoGallery } from "@/components/marketing/editorial-manifesto-gallery";
import { InteractiveIntentMatrix } from "@/components/marketing/interactive-intent-matrix";
import { CuratedServicesBento } from "@/components/marketing/curated-services-bento";
import { MapDemoPreview } from "@/components/marketing/map-demo-preview";
import { EditorialTestimonialCard } from "@/components/marketing/editorial-testimonial-card";
import { EditorialMarketNotes } from "@/components/marketing/editorial-market-notes";
import { MonolithicFooter } from "@/components/marketing/monolithic-footer";

export default function HomePage() {
  const [currentFrame, setCurrentFrame] = useState(1);
  const totalFrames = 302;

  return (
    <div className="min-h-screen bg-[#0B1711] text-[#141715] font-sans antialiased selection:bg-[#E57A1A] selection:text-white">
      {/* 1. Glassmorphic Navigation Bar */}
      <LuxuryNavbar />

      {/* 2. 60fps Full-Screen Film Scroll Canvas */}
      <FilmScrollCanvas
        totalFrames={totalFrames}
        framePrefix="/frames/frame_"
        frameExt=".webp"
        onFrameChange={(frame) => setCurrentFrame(frame)}
      />

      {/* 3. Multi-Scene Frame-Synced Text & UI Overlays */}
      <FilmScrollOverlays
        currentFrame={currentFrame}
        totalFrames={totalFrames}
      />

      {/* 4. Editorial Content & Operations Sections (Seamless Ground Hand-Off) */}
      <div id="mandates" className="relative z-20 bg-[#FAF8F5] shadow-2xl rounded-t-[40px] sm:rounded-t-[56px] border-t border-stone-200/80">
        
        {/* The Contour Manifesto & Staggered Photo Grid */}
        <EditorialManifestoGallery />

        {/* Kinetic Intent Switcher (Buy / Sell / Lease / Develop) */}
        <InteractiveIntentMatrix />

        {/* Curated Services & Legal Title Bento Grid */}
        <CuratedServicesBento />

        {/* Interactive Spatial Lusaka Map & Coordinates */}
        <MapDemoPreview />

        {/* Executive Testimonials & Proof */}
        <EditorialTestimonialCard />

        {/* Lusaka Market Intelligence */}
        <EditorialMarketNotes />

        {/* Monolithic Footer */}
        <MonolithicFooter />
      </div>
    </div>
  );
}

