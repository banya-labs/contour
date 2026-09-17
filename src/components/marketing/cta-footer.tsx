"use client";

import React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { CornerMark } from "@/components/ui/corner-mark";
import { ease } from "@/lib/animation-variants";
import { ContourLogo } from "@/components/brand/contour-logo";

export function CtaFooter() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  const logoY = useTransform(scrollYProgress, [0, 1], [30, -10]);

  const navColumns = [
    {
      title: "PRODUCT",
      links: [
        { label: "Mandate Capture", href: "#product" },
        { label: "Deal Pipeline", href: "#product" },
        { label: "Commission Tracking", href: "#product" },
        { label: "Lease & Arrears", href: "#product" },
        { label: "WhatsApp Syndication", href: "#product" },
        { label: "Document Vault", href: "#product" },
      ],
    },
    {
      title: "PLATFORM",
      links: [
        { label: "Field Agent PWA", href: "/kiosk" },
        { label: "Lusaka Real Estate Map", href: "/dashboard/map" },
        { label: "API & Model Context Protocol", href: "/admin/mcp" },
        { label: "PowerSync Offline Engine", href: "#how-it-works" },
        { label: "Security & POPIA Compliance", href: "#pricing" },
      ],
    },
    {
      title: "COMPANY",
      links: [
        { label: "About Contour", href: "#product" },
        { label: "Commercial Pricing", href: "#pricing" },
        { label: "Venture Portfolio", href: "https://banyalabs.com" },
        { label: "Research & Documentation", href: "#how-it-works" },
        { label: "Agent Careers", href: "mailto:careers@contour.banyalabs.com" },
      ],
    },
    {
      title: "CONTACT",
      links: [
        { label: "Book a Demo", href: "/sign-in" },
        { label: "hello@contour.zm", href: "mailto:hello@contour.zm" },
        { label: "WhatsApp Desk (+260)", href: "https://wa.me/260970000000" },
        { label: "Developer Support", href: "mailto:support@contour.zm" },
        { label: "Privacy Policy (Zambia DPA)", href: "/privacy" },
        { label: "Terms of Use (ECT Act)", href: "/terms" },
      ],
    },
  ];

  return (
    <footer
      id="contact"
      ref={containerRef}
      className="relative w-full bg-white overflow-hidden text-editorial-black"
    >
      <CornerMark position="top-left" className="top-2 left-2" />
      <CornerMark position="top-right" className="top-2 right-2" />

      {/* Header Bar: "GET STARTED" */}
      <div className="w-full border-t border-b border-editorial-border py-3 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-center gap-6">
          <div className="flex-1 h-px bg-editorial-border" />
          <span className="font-geist text-xs font-semibold uppercase tracking-[0.25em] text-editorial-muted whitespace-nowrap">
            GET STARTED
          </span>
          <div className="flex-1 h-px bg-editorial-border" />
        </div>
      </div>

      {/* Upper CTA Section with the Sun Bookend Framed in 1400px Container */}
      <div className="w-full border-b border-editorial-border bg-white">
        <div className="max-w-[1400px] mx-auto border-x border-editorial-border grid grid-cols-1 lg:grid-cols-12 min-h-[440px]">
          {/* Left 60%: Giant Headline + CTA Buttons */}
          <div className="lg:col-span-8 p-6 sm:p-14 lg:p-20 flex flex-col justify-center">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: ease.out }}
              className="font-heading font-bold text-3xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tighter text-editorial-black uppercase leading-[0.94] [text-wrap:balance]"
            >
              BETTER REAL ESTATE <br />
              STARTS WITH CONTOUR.
            </motion.h2>

            <p className="mt-4 sm:mt-6 font-geist text-xs sm:text-base text-editorial-muted max-w-prose leading-relaxed">
              The high-precision real estate operating system engineered for Lusaka brokerages.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                href="/sign-in"
                className="btn-fill-wipe bg-editorial-black text-white px-6 sm:px-8 py-3.5 sm:py-4 font-heading text-xs sm:text-base font-semibold tracking-wide text-center"
              >
                <span>Book a Demo →</span>
              </Link>
              <Link
                href="/sign-up"
                className="btn-fill-wipe-dark border border-editorial-black bg-transparent text-editorial-black px-6 sm:px-8 py-3.5 sm:py-4 font-heading text-xs sm:text-base font-semibold tracking-wide text-center"
              >
                <span>Start Free Trial →</span>
              </Link>
            </div>
          </div>

          {/* Right 40%: The Red Zambian Sun (Bookend Sunset Motif) */}
          <div className="lg:col-span-4 relative flex items-center justify-center p-6 sm:p-8 overflow-hidden min-h-[220px] sm:min-h-[260px] lg:min-h-0 bg-neutral-50/40">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, x: 60 }}
              whileInView={{ scale: 1, opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: ease.out }}
              className="w-[180px] h-[180px] sm:w-[300px] sm:h-[300px] lg:w-[360px] lg:h-[360px] rounded-full bg-editorial-red circle-float pointer-events-none translate-x-[15%]"
            />
          </div>
        </div>
      </div>

      {/* 4-Column Footer Navigation Grid Framed in 1400px Container */}
      <div className="w-full border-b border-editorial-border bg-white">
        <div className="max-w-[1400px] mx-auto border-x border-editorial-border grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-editorial-border">
          {navColumns.map((col) => (
            <div key={col.title} className="p-4 sm:p-10 flex flex-col gap-2.5 sm:gap-3">
              <h4 className="font-geist text-xs font-bold uppercase tracking-widest text-editorial-black mb-1">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="font-geist text-xs sm:text-sm text-editorial-muted hover:text-editorial-black hover-un py-0.5 transition-colors block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Giant Full-Bleed CONTOUR Watermark Logotype Framed in 1400px Container */}
      <div className="w-full border-b border-editorial-border bg-neutral-50/20 overflow-hidden select-none pointer-events-none">
        <div className="max-w-[1400px] mx-auto border-x border-editorial-border py-4 sm:py-8">
          <motion.div
            style={{ y: logoY }}
            className="font-heading font-black text-[18vw] lg:text-[210px] leading-none tracking-tighter text-editorial-logo text-center uppercase whitespace-nowrap opacity-90"
          >
            CONTOUR
          </motion.div>
        </div>
      </div>

      {/* Bottom Legal Strip Framed in 1400px Container */}
      <div className="w-full bg-white">
        <div className="max-w-[1400px] mx-auto border-x border-editorial-border px-6 sm:px-10 lg:px-16 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 font-geist text-xs text-editorial-muted">
          <div className="flex items-center gap-3">
            <ContourLogo size="sm" />
            <span className="hidden sm:inline text-editorial-border">|</span>
            <span>© 2026 Contour · Part of Banya Labs · Zambia DPA No. 3 of 2021 Compliant</span>
            <span className="hidden sm:inline text-editorial-border">|</span>
            <Link href="/privacy" className="hover:text-editorial-black underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-editorial-black underline">
              Terms of Use
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <span>Lusaka · Harare · Johannesburg</span>
            <span className="text-editorial-red font-bold">ZMW / USD</span>
          </div>
        </div>
      </div>

      <CornerMark position="bottom-left" className="bottom-2 left-2" />
      <CornerMark position="bottom-right" className="bottom-2 right-2" />
    </footer>
  );
}
