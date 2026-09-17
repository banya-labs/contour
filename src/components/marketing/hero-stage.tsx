"use client";

import React from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { CornerMark } from "@/components/ui/corner-mark";
import { ease } from "@/lib/animation-variants";

export function HeroStage() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    // Small delay ensures the initial hidden state renders first, then the
    // animation fires — giving us the visible "sun rises from behind building" effect.
    const timer = setTimeout(() => setHasMounted(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Sun gently drifts upward on scroll (parallax)
  const sunYScroll = useTransform(scrollYProgress, [0, 0.5], [0, -60]);
  const sunOpacityScroll = useTransform(scrollYProgress, [0, 0.4], [1, 0.4]);

  const systemAspects = [
    {
      code: "01",
      category: "Legal Compliance",
      title: "Title Deed & Mandate Custody",
      highlight: "Ministry of Lands & NRC verification",
      description:
        "Encrypted custody for Certificates of Title, NRC identity scans & legal mandates.",
    },
    {
      code: "02",
      category: "Data Security",
      title: "POPIA Data Sovereignty",
      highlight: "Tenant-isolated vault & 15-min presigned tokens",
      description:
        "Strict tenant isolation, immutable audit logs & 15-minute presigned document tokens.",
    },
    {
      code: "03",
      category: "Field Architecture",
      title: "Offline-First Mobile PWA",
      highlight: "PowerSync SQLite sync for Lusaka field agents",
      description:
        "PowerSync SQLite local cache resilient to ZESCO load-shedding & spotty Lusaka mobile signal.",
    },
    {
      code: "04",
      category: "Automated Operations",
      title: "WhatsApp Arrears Sentinel",
      highlight: "Automated arrears nudges & 30-day anti-poaching",
      description:
        "Automated lease arrears reminders, 1-tap branded flyers & 30-day client protection.",
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // The HERO.png is 1920×1080 with a TRANSPARENT sky. The building's roofline
  // sits at roughly 42% from the top and the main house peak is at ~82% from
  // the left (18% from the right). The sun rises FROM behind that roofline.
  //
  // Layer stack (bottom → top):
  //   z-0  Dawn atmosphere gradient (warm amber/orange sky)
  //   z-10 Sun circle — visible through PNG's transparent sky pixels
  //   z-20 HERO.png (transparent sky lets the sun show through)
  //   z-30 Text content overlay
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <section
      ref={containerRef}
      className="relative w-full pt-[72px] bg-white overflow-hidden"
    >
      {/* Container Frame with 1400px Master Editorial Margins */}
      <div className="max-w-[1400px] mx-auto relative border-x border-editorial-border">
        <CornerMark position="top-left" />
        <CornerMark position="top-right" />

        {/* Main 16:9 Photographic Stage */}
        <div
          className="relative w-full aspect-[16/9] min-h-[560px] max-h-[820px] flex items-center overflow-hidden"
          style={{
            // Dawn sky gradient — warm amber near the horizon, pale cream at top.
            // This colour shows through the PNG's transparent sky pixels.
            background:
              "linear-gradient(to bottom, #FDF6ED 0%, #FDEBD0 30%, #FDD09A 55%, #F9A55A 70%, #F0793A 80%, #E85C20 88%, #D94810 95%, #C73A08 100%)",
          }}
        >
          {/* ── Layer 1: The Zambian Red Sun ── */}
          {/* Outer wrapper: handles scroll parallax + absolute positioning */}
          <motion.div
            className="absolute pointer-events-none z-10"
            style={{
              // Centre-point is the building's highest roofline ~82% from left = 18% from right
              // We offset by half the sun disc size (110px) to centre it
              right: "14%",
              top: "42%",
              y: sunYScroll,
              opacity: sunOpacityScroll,
            }}
          >
            {/* Inner wrapper: handles the load-time rise animation */}
            <motion.div
              initial={{ y: 0 }}
              animate={hasMounted ? { y: "-220px" } : { y: 0 }}
              transition={{
                duration: 2.8,
                ease: ease.out,
                delay: 0.15,
              }}
              style={{ transform: "translate(50%, -50%)" }}
            >
              {/* Sun disc — flat editorial-red circle */}
              <div
                className="rounded-full bg-editorial-red w-[200px] h-[200px] sm:w-[330px] sm:h-[330px]"
              />
            </motion.div>
          </motion.div>

          {/* ── Layer 2: HERO.png — transparent sky reveals sun & sky behind ── */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <Image
              src="/images/HERO.png"
              alt="Contour Lusaka modernist luxury villa architecture"
              fill
              priority
              unoptimized
              className="object-cover object-center"
              sizes="(max-width: 1400px) 100vw, 1400px"
            />
            {/* Gradient veil on left side for headline legibility */}
            <div
              className="absolute inset-y-0 left-0 w-full sm:w-1/2 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, rgba(253,246,237,0.95) 0%, rgba(253,246,237,0.7) 60%, transparent 100%)",
              }}
            />
          </div>

          {/* ── Layer 3: Editorial Text Content ── */}
          <div className="relative z-30 w-full px-4 sm:px-10 lg:px-16 py-6 sm:py-8 flex flex-col justify-center">
            <div
              className="max-w-2xl p-5 sm:p-10 border border-editorial-border backdrop-blur-sm"
              style={{ background: "rgba(253,246,237,0.95)" }}
            >
              <h1 className="font-heading font-bold text-3xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tighter text-editorial-black uppercase leading-[0.95] [text-wrap:balance]">
                RUN YOUR AGENCY.
              </h1>
              <h1 className="mt-1 sm:mt-2 font-heading font-bold text-3xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tighter text-editorial-black uppercase leading-[0.95] [text-wrap:balance]">
                CHASE NOTHING.
              </h1>
              <p className="mt-4 sm:mt-6 font-geist text-xs sm:text-base text-editorial-black/80 max-w-prose leading-relaxed">
                The mandate operating system for Lusaka real estate agents.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <a
                  href="#how-it-works"
                  className="btn-fill-wipe bg-editorial-black text-white px-6 sm:px-7 py-3 sm:py-3.5 font-heading text-xs sm:text-sm font-semibold tracking-wide border-none rounded-none text-center"
                >
                  <span>See How It Works →</span>
                </a>
                <a
                  href="#pricing"
                  className="btn-fill-wipe-dark border border-editorial-black bg-transparent text-editorial-black px-6 sm:px-7 py-3 sm:py-3.5 font-heading text-xs sm:text-sm font-semibold tracking-wide rounded-none text-center"
                >
                  <span>View Plans</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <CornerMark position="bottom-left" />
        <CornerMark position="bottom-right" />
      </div>

      {/* ── Key System Aspects Strip ── */}
      <div className="w-full border-t border-b border-editorial-black bg-white">
        <div className="max-w-[1400px] mx-auto border-x border-editorial-black">
          {/* Mobile View: Single compact row infinite marquee (< md) — 50% slower flow (duration 32s) */}
          <div className="md:hidden overflow-hidden py-3 bg-white flex whitespace-nowrap select-none">
            <motion.div
              className="flex items-center gap-6 shrink-0 pr-6"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration: 32,
              }}
            >
              {[...systemAspects, ...systemAspects, ...systemAspects, ...systemAspects].map((aspect, idx) => (
                <div key={idx} className="flex items-baseline gap-2 shrink-0">
                  <span className="font-mono text-[10px] font-bold text-editorial-red tracking-wider">
                    {aspect.code}
                  </span>
                  <span className="font-heading font-bold text-xs sm:text-sm text-editorial-black uppercase tracking-tight">
                    {aspect.title}
                  </span>
                  <span className="font-geist text-[10px] sm:text-xs text-editorial-muted">
                    ({aspect.highlight})
                  </span>
                  <span className="text-neutral-300 ml-4 font-mono text-xs">•</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Desktop View (md+): 4-column architectural grid */}
          <div className="hidden md:grid md:grid-cols-4 divide-x divide-editorial-black">
            {systemAspects.map((aspect) => (
              <div
                key={aspect.code}
                className="px-6 sm:px-8 py-6 sm:py-7 flex flex-col justify-between items-start group hover:bg-editorial-hover transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[11px] font-bold text-editorial-red tracking-wider">
                      {aspect.code}
                    </span>
                    <span className="font-geist text-[10px] font-semibold uppercase tracking-widest text-editorial-muted">
                      {aspect.category}
                    </span>
                  </div>
                  <span className="font-heading font-bold text-lg lg:text-xl tracking-tight text-editorial-black block">
                    {aspect.title}
                  </span>
                </div>
                <p className="mt-2 font-geist text-xs text-editorial-muted leading-relaxed">
                  {aspect.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
