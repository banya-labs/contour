"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles, MapPin, CheckCircle2 } from "lucide-react";

export function EditorialManifestoGallery() {
  const [activePillar, setActivePillar] = useState<number | null>(0);

  const galleryItems = [
    {
      id: "1",
      title: "The Kabulonga Pavilion",
      location: "Kabulonga, Lusaka",
      price: "$850,000",
      specs: "4 Bed • 5 Bath • Infinity Pool",
      tag: "Diplomatic Zone",
      image: "/images/solidroad/asset_28_mFBjbn51LwCjG5D3RgYP.png",
      span: "md:col-span-4",
    },
    {
      id: "2",
      title: "The Baobab Sanctuary",
      location: "Leopards Hill, Lusaka",
      price: "$1,400,000",
      specs: "6 Bed • 7 Bath • 2.5 Acres",
      tag: "Private Acreage",
      image: "/images/solidroad/asset_33_qq46LRopVAERA1djCvgl.png",
      span: "md:col-span-5",
    },
    {
      id: "3",
      title: "Roma Park Executive Villa",
      location: "Roma Park, Lusaka",
      price: "$620,000",
      specs: "4 Bed • 4 Bath • Solar Microgrid",
      tag: "Gated Enclave",
      image: "/images/solidroad/asset_38_lRau233hnNDJEhOiUyWJ.png",
      span: "md:col-span-3",
    },
  ];

  const pillars = [
    {
      title: "Get Clarity",
      subtitle: "We define what you truly need — not just what is currently available on the market.",
      detail: "Direct zoning analysis, water table checks, and municipal infrastructure verification before you tour.",
    },
    {
      title: "Move Forward",
      subtitle: "We find what fits and make the transaction seamless and predictable.",
      detail: "Structured negotiation backed by 10-year Lusaka price comps and legal escrow oversight.",
    },
    {
      title: "Own With Certainty",
      subtitle: "Direct Ministry of Lands title custody with 100% verified ownership records.",
      detail: "NRC identity verification, white-glove deed transfer tracking, and zero hidden broker dilution.",
    },
  ];

  return (
    <section id="properties" className="py-24 bg-[#FAF8F5] border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section 1: Editorial Manifesto Headline & Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start mb-16">
          <div className="lg:col-span-5">
            <span className="text-xs font-mono uppercase tracking-widest text-[#E57A1A] font-bold">
              The Contour Manifesto
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#141715] mt-2 tracking-tight leading-[1.15]">
              Your life is changing. <br />
              <span className="italic text-stone-600 font-normal">Don’t just find a place.</span>
            </h2>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between">
            <p className="text-stone-700 text-base sm:text-lg md:text-xl font-medium leading-relaxed">
              Find what’s next. We help high-performing investors, diplomatic tenants, and property owners move forward with clarity, confidence, and vetted field agents by their side.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#141715] hover:text-[#E57A1A] transition-colors group"
              >
                <span>Browse all 48 Lusaka luxury listings</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Section 2: Asymmetrical Architectural Photography Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-24">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className={`${item.span} group relative rounded-3xl overflow-hidden bg-stone-900 border border-stone-200 shadow-lg hover:shadow-2xl transition-all duration-500 min-h-[380px] sm:min-h-[440px] flex flex-col justify-end p-6`}
            >
              {/* Background Image with Hover Scale */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-85 group-hover:opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Top Pill */}
              <div className="absolute top-5 left-5 z-10">
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#141715] text-[10px] font-bold uppercase tracking-wider shadow">
                  {item.tag}
                </span>
              </div>

              {/* Bottom Details */}
              <div className="relative z-10 text-white">
                <div className="flex items-center gap-1.5 text-xs text-stone-300 font-medium mb-1">
                  <MapPin className="w-3 h-3 text-[#E57A1A]" />
                  <span>{item.location}</span>
                </div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-white mb-2 group-hover:text-stone-200 transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between border-t border-white/20 pt-3 mt-2">
                  <div className="font-serif font-bold text-lg text-white">
                    {item.price}
                  </div>
                  <div className="text-[11px] font-mono text-stone-300">
                    {item.specs}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section 3: Kinetic Identity & Interactive Chevron Pillars */}
        <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#E57A1A]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl mb-12">
            <div className="flex items-center gap-2 text-[#E57A1A] text-xs font-mono font-bold uppercase tracking-widest mb-3">
              <span>Operational Philosophy</span>
              <span className="tracking-tighter font-mono text-base font-black">{'>>>'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-tight leading-snug">
              This isn’t just about real estate. <br className="hidden sm:block" />
              <span className="text-stone-300 font-normal italic">
                It’s about identity. Progress. Getting unstuck.
              </span>
            </h3>
            <p className="text-stone-400 text-sm sm:text-base mt-4 font-normal leading-relaxed">
              You’re not just looking for square meters. You’re looking for legal security, architectural alignment, and zero-friction execution. That’s what Contour delivers.
            </p>
          </div>

          {/* Interactive Accordion Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                onClick={() => setActivePillar(activePillar === idx ? null : idx)}
                className={`cursor-pointer p-6 rounded-2xl border transition-all duration-300 ${
                  activePillar === idx
                    ? "bg-white/10 border-white/30 shadow-xl"
                    : "bg-white/5 border-white/10 hover:bg-white/[0.08]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-[#E57A1A]">
                    0{idx + 1}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${
                      activePillar === idx ? "rotate-90 text-white" : ""
                    }`}
                  />
                </div>
                <h4 className="font-serif font-bold text-lg text-white mb-2">
                  {pillar.title}
                </h4>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-3">
                  {pillar.subtitle}
                </p>
                {activePillar === idx && (
                  <div className="text-stone-400 text-xs border-t border-white/10 pt-3 animate-in fade-in duration-200">
                    {pillar.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
