"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerMark } from "@/components/ui/corner-mark";
import { ease } from "@/lib/animation-variants";

interface Feature {
  id: string;
  num: string;
  name: string;
  desc: string;
  tag: string;
}

export function ProductFeatures() {
  const [activeId, setActiveId] = useState("02");

  const features: Feature[] = [
    {
      id: "01",
      num: "01",
      name: "Mandate Capture",
      desc: "Add any listing in under 2 minutes with title deed and landlord verification.",
      tag: "MANDATE INTAKE — ACTIVE VIEW",
    },
    {
      id: "02",
      num: "02",
      name: "Deal Pipeline",
      desc: "Every deal, every stage, always visible across your entire agency.",
      tag: "DEAL PIPELINE — ACTIVE VIEW",
    },
    {
      id: "03",
      num: "03",
      name: "Commission Tracking",
      desc: "Every 5% locked, transparent, and accounted for from offer to registration.",
      tag: "COMMISSION LEDGER — ACTIVE VIEW",
    },
    {
      id: "04",
      num: "04",
      name: "Lease & Arrears",
      desc: "Automated WhatsApp reminders sent before you ever need to chase.",
      tag: "ARREARS SENTINEL — ACTIVE VIEW",
    },
    {
      id: "05",
      num: "05",
      name: "WhatsApp Syndication",
      desc: "One-tap branded flyer generated with masked landlord PII to any client group.",
      tag: "SYNDICATION HUB — ACTIVE VIEW",
    },
    {
      id: "06",
      num: "06",
      name: "Document Vault",
      desc: "Certificates of Title and NRC identity scans encrypted with POPIA compliance.",
      tag: "LEGAL CUSTODY — ACTIVE VIEW",
    },
  ];

  const activeFeature = features.find((f) => f.id === activeId) || features[1];

  return (
    <section id="product" className="relative w-full bg-white overflow-hidden">
      <CornerMark position="top-left" className="top-2 left-2" />
      <CornerMark position="top-right" className="top-2 right-2" />

      {/* Header Bar: "THE SYSTEM" */}
      <div className="w-full border-t border-b border-editorial-border py-3 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-center gap-6">
          <div className="flex-1 h-px bg-editorial-border" />
          <span className="font-geist text-xs font-semibold uppercase tracking-[0.25em] text-editorial-muted whitespace-nowrap">
            THE SYSTEM
          </span>
          <div className="flex-1 h-px bg-editorial-border" />
        </div>
      </div>

      {/* Section Headline */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16 text-center border-x border-editorial-border">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="font-heading font-bold text-4xl sm:text-5xl lg:text-7xl tracking-tighter text-editorial-black uppercase leading-[0.98] [text-wrap:balance]"
        >
          ONE SCREEN. <br />
          EVERY MANDATE, EVERY DEAL.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: ease.out, delay: 0.15 }}
          className="mt-5 font-geist text-sm sm:text-base text-editorial-muted max-w-prose mx-auto"
        >
          Contour is the operating system for Lusaka real estate agents — from mandate capture to commission cleared.
        </motion.p>
      </div>

      {/* Main Interactive Grid (Two Columns: 40% Features / 60% Blueprint Canvas) Framed in 1400px Container */}
      <div className="w-full border-t border-b border-editorial-border bg-white">
        <div className="max-w-[1400px] mx-auto border-x border-editorial-border grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-editorial-border">
          {/* Left Column: 6 Features (40% width) */}
          <div className="lg:col-span-5 divide-y divide-editorial-border">
            {features.map((item) => {
              const isActive = item.id === activeId;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  onMouseEnter={() => setActiveId(item.id)}
                  className={`w-full text-left p-4 sm:p-7 flex items-start justify-between transition-all duration-200 group relative ${
                    isActive
                      ? "bg-editorial-hover"
                      : "hover:bg-neutral-50/80"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="font-geist font-semibold text-lg text-editorial-red select-none flex items-center gap-1.5 pt-0.5">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-editorial-red inline-block" />}
                      <span>{item.num}</span>
                    </span>
                    <div>
                      <h3 className="font-heading font-bold text-base sm:text-lg text-editorial-black tracking-tight flex items-center gap-2">
                        <span>Feature {item.num} — {item.name}</span>
                      </h3>
                      <p className="mt-1 font-geist text-xs sm:text-sm text-editorial-muted leading-relaxed">
                        "{item.desc}"
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-geist text-base transition-transform duration-200 text-editorial-black ml-4 ${
                      isActive ? "translate-x-1 font-bold text-editorial-red" : "opacity-40 group-hover:opacity-100 group-hover:translate-x-1"
                    }`}
                  >
                    →
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Dynamic Architectural Blueprint Illustration (60% width) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden topo-pattern-bg">
            {/* View Tag */}
            <div className="flex items-center justify-between border-b border-editorial-border/80 pb-4 mb-6 z-10">
              <span className="font-geist text-xs font-semibold uppercase tracking-wider text-editorial-black">
                {activeFeature.tag}
              </span>
              <span className="font-geist text-[11px] text-editorial-muted">
                CONTOUR CAD-OS // REV 2.4
              </span>
            </div>

            {/* Dynamic Illustration Canvas */}
            <div className="relative min-h-[380px] sm:min-h-[440px] flex items-center justify-center p-4 border border-editorial-border bg-white z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: ease.out }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {activeId === "01" && <MandateCaptureBlueprint />}
                  {activeId === "02" && <DealPipelineBlueprint />}
                  {activeId === "03" && <CommissionLedgerBlueprint />}
                  {activeId === "04" && <LeaseArrearsBlueprint />}
                  {activeId === "05" && <WhatsAppSyndicationBlueprint />}
                  {activeId === "06" && <DocumentVaultBlueprint />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Blueprint Footer Note */}
            <div className="mt-6 pt-4 border-t border-editorial-border flex items-center justify-between font-geist text-xs text-editorial-muted z-10">
              <span>Stand # 8942-A · Lusaka Plateau (1,280m)</span>
              <span className="flex items-center gap-1 text-editorial-red">
                <span className="w-1.5 h-1.5 rounded-full bg-editorial-red inline-block" />
                Live Sync
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Thumbnail Strip (Quick Navigation) Framed in 1400px Grid */}
      <div className="w-full border-b border-editorial-border overflow-x-auto no-scrollbar bg-white">
        <div className="max-w-[1400px] mx-auto border-x border-editorial-border">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-editorial-border min-w-[720px] lg:min-w-0">
            {features.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveId(f.id)}
                className={`px-4 py-3 text-left font-geist text-xs transition-colors flex items-center justify-between ${
                  f.id === activeId
                    ? "bg-editorial-hover text-editorial-black font-semibold border-b-2 border-editorial-red"
                    : "text-editorial-muted hover:text-editorial-black hover:bg-neutral-50"
                }`}
              >
                <span className="truncate">
                  {f.num} {f.name}
                </span>
                <span className="text-[10px] text-editorial-red font-bold">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <CornerMark position="bottom-left" className="bottom-2 left-2" />
      <CornerMark position="bottom-right" className="bottom-2 right-2" />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Architectural Blueprint SVGs                                               */
/* -------------------------------------------------------------------------- */

function DealPipelineBlueprint() {
  const columns = [
    { title: "New", cards: 2 },
    { title: "Viewing", cards: 3 },
    { title: "Offer", cards: 2 },
    { title: "Signed", cards: 2, hasRedDot: true },
    { title: "Closed", cards: 1 },
  ];

  return (
    <div className="w-full max-w-2xl py-4">
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {columns.map((col, idx) => (
          <div
            key={col.title}
            className="border border-editorial-black p-2 sm:p-3 bg-white flex flex-col gap-2 min-h-[260px]"
          >
            <div className="font-heading text-xs sm:text-sm font-bold border-b border-editorial-border pb-1 text-center">
              {col.title}
            </div>
            {Array.from({ length: col.cards }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="border border-editorial-border p-2 text-[10px] font-geist relative bg-neutral-50/50"
              >
                <div className="flex items-center gap-1 text-editorial-black font-medium">
                  <span>⌂</span>
                  <span className="truncate">Villa #{idx + 1}0{cIdx + 1}</span>
                </div>
                <div className="mt-1 h-1 w-3/4 bg-editorial-border" />
                <div className="mt-1 h-1 w-1/2 bg-editorial-border" />
                {col.hasRedDot && cIdx === 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-editorial-red" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between font-geist text-[11px] text-editorial-muted">
        <span>FLOW DIRECTION: NEW → VIEWING → OFFER → SIGNED → CLOSED</span>
        <span className="text-editorial-red font-semibold">5 Active Stages</span>
      </div>
    </div>
  );
}

function MandateCaptureBlueprint() {
  return (
    <div className="w-full max-w-md border border-editorial-black p-6 bg-white flex flex-col gap-4 font-geist">
      <div className="border-b border-editorial-black pb-2 flex items-center justify-between">
        <span className="font-heading font-bold text-sm">EXCLUSIVE MANDATE // FORM 104</span>
        <span className="w-2 h-2 rounded-full bg-editorial-red" />
      </div>
      <div className="space-y-3 text-xs">
        <div>
          <span className="text-editorial-muted block text-[10px]">PROPERTY STAND IDENTIFIER</span>
          <div className="border-b border-editorial-border py-1 font-semibold">Stand # 8942-A, Leopards Hill</div>
        </div>
        <div>
          <span className="text-editorial-muted block text-[10px]">VERIFIED REGISTERED OWNER</span>
          <div className="border-b border-editorial-border py-1">Mulenga Mwape (NRC 492019/11/1)</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-editorial-muted block text-[10px]">ASKING PRICE</span>
            <div className="border-b border-editorial-border py-1 font-semibold text-editorial-red">ZMW 14,500,000</div>
          </div>
          <div>
            <span className="text-editorial-muted block text-[10px]">COMMISSION</span>
            <div className="border-b border-editorial-border py-1 font-semibold">5.0% Fixed</div>
          </div>
        </div>
      </div>
      <div className="mt-4 border-t border-editorial-black pt-3 flex items-center justify-between text-[11px]">
        <span className="text-editorial-muted">ELECTRONIC SIGNATURE: CERTIFIED</span>
        <span className="font-heading font-bold text-editorial-red">VALIDATED ✓</span>
      </div>
    </div>
  );
}

function CommissionLedgerBlueprint() {
  const rows = [
    { property: "Ibex Hill Executive Residence", gross: "K 9,500,000", comm: "K 475,000", status: "CLEARED" },
    { property: "Leopards Hill Contemporary Villa", gross: "K 14,500,000", comm: "K 725,000", status: "ESCROW" },
    { property: "Kabulonga Diplomatic Manor", gross: "K 22,000,000", comm: "K 1,100,000", status: "PENDING" },
  ];

  return (
    <div className="w-full max-w-lg border border-editorial-black p-5 bg-white font-geist text-xs">
      <div className="flex items-center justify-between border-b border-editorial-black pb-2 mb-3">
        <span className="font-heading font-bold text-sm">COMMISSION LEDGER & DISBURSEMENT</span>
        <span className="text-editorial-red font-bold">5% ENFORCED</span>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-editorial-border text-[10px] text-editorial-muted uppercase">
            <th className="py-2">Mandate</th>
            <th className="py-2 text-right">Gross</th>
            <th className="py-2 text-right">Commission</th>
            <th className="py-2 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-editorial-border">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-neutral-50">
              <td className="py-2.5 font-medium truncate max-w-[160px]">{r.property}</td>
              <td className="py-2.5 text-right text-editorial-muted">{r.gross}</td>
              <td className="py-2.5 text-right font-bold text-editorial-black">{r.comm}</td>
              <td className="py-2.5 text-right">
                <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold ${
                  r.status === "CLEARED" ? "bg-editorial-red text-white" : "bg-neutral-100 text-editorial-black"
                }`}>
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 pt-3 border-t border-editorial-black flex items-center justify-between font-bold">
        <span>TOTAL RECOVERABLE AGENCY COMMISSION:</span>
        <span className="text-editorial-red text-sm">ZMW 2,300,000</span>
      </div>
    </div>
  );
}

function LeaseArrearsBlueprint() {
  return (
    <div className="w-full max-w-md border border-editorial-black p-5 bg-white font-geist text-xs space-y-4">
      <div className="flex items-center justify-between border-b border-editorial-black pb-2">
        <span className="font-heading font-bold text-sm">WHATSAPP ARREARS AUTOMATION</span>
        <span className="text-editorial-red text-xs">4-DAY COOLDOWN</span>
      </div>
      <div className="space-y-2 text-[11px]">
        <div className="p-3 bg-neutral-100 border border-editorial-border rounded-none">
          <span className="text-[9px] text-editorial-muted block">CONTOUR BOT DISPATCH // 08:30 CAT</span>
          "Dear Mr. Tembo, gentle reminder that monthly rental for Stand #401 (K 28,000) was due on 1st Sept. Pay via ZMW direct transfer."
        </div>
        <div className="p-3 bg-editorial-hover border border-editorial-red/40 rounded-none ml-6">
          <span className="text-[9px] text-editorial-red block">TENANT CONFIRMATION // 10:15 CAT</span>
          "Payment proof attached. Transfer ref: TX-902418-ZMW."
        </div>
      </div>
      <div className="border-t border-editorial-black pt-3 flex items-center justify-between text-xs font-bold">
        <span>RECONCILED IN CONTOUR:</span>
        <span className="text-emerald-700">PAID & RECEIPTED ✓</span>
      </div>
    </div>
  );
}

function WhatsAppSyndicationBlueprint() {
  return (
    <div className="w-full max-w-md border border-editorial-black p-5 bg-white font-geist text-xs">
      <div className="border-b border-editorial-black pb-2 flex items-center justify-between">
        <span className="font-heading font-bold text-sm">1-CLICK WHATSAPP FLYER SYNDICATION</span>
        <span className="w-2 h-2 rounded-full bg-editorial-red" />
      </div>
      <div className="mt-4 border border-editorial-border p-4 bg-neutral-50/60 flex flex-col gap-2">
        <div className="h-28 border border-editorial-black bg-white flex items-center justify-center text-editorial-muted text-xs">
          [HIGH-RES PROPERTY PREVIEW · 16:9]
        </div>
        <div className="font-bold text-sm text-editorial-black">5-BED EXECUTIVE VILLA · KABULONGA</div>
        <div className="text-editorial-muted text-[11px]">Asking: ZMW 18,000,000 · Verified Certificate of Title</div>
        <div className="text-[10px] text-editorial-black/70 bg-white p-2 border border-editorial-border">
          ✓ Landlord phone & PII automatically masked<br />
          ✓ Direct inquiry links to your WhatsApp agent line
        </div>
      </div>
      <div className="mt-4 border-t border-editorial-black pt-2 flex items-center justify-between text-[11px]">
        <span>SYNDICATION TARGETS: 12 BROKER GROUPS</span>
        <span className="font-bold text-editorial-red">BROADCASTED</span>
      </div>
    </div>
  );
}

function DocumentVaultBlueprint() {
  const docs = [
    { title: "Certificate of Title (Ministry of Lands)", size: "4.2 MB", enc: "AES-256" },
    { title: "National Registration Card (NRC Scans)", size: "1.8 MB", enc: "POPIA LOCKED" },
    { title: "Exclusive Selling Mandate Agreement", size: "840 KB", enc: "SIGNATURE OK" },
  ];

  return (
    <div className="w-full max-w-md border border-editorial-black p-5 bg-white font-geist text-xs">
      <div className="border-b border-editorial-black pb-2 flex items-center justify-between mb-4">
        <span className="font-heading font-bold text-sm">ENCRYPTED TITLE & NRC VAULT</span>
        <span className="text-editorial-red font-bold">POPIA S3 COMPLIANT</span>
      </div>
      <div className="space-y-2">
        {docs.map((doc, idx) => (
          <div key={idx} className="border border-editorial-border p-3 flex items-center justify-between bg-neutral-50/40">
            <div>
              <div className="font-semibold text-editorial-black">{doc.title}</div>
              <div className="text-[10px] text-editorial-muted">{doc.size} · Cloud Custody</div>
            </div>
            <span className="font-mono text-[9px] font-bold px-2 py-0.5 border border-editorial-black bg-white">
              {doc.enc}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-editorial-black flex items-center justify-between text-[11px]">
        <span>IMMUTABLE AUDIT TRAIL</span>
        <span className="text-editorial-red font-bold">15-MIN TOKENIZED ACCESS</span>
      </div>
    </div>
  );
}
