"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerMark } from "@/components/ui/corner-mark";
import { ease } from "@/lib/animation-variants";

type WorkflowKey = "SELL" | "RENT" | "LEASE" | "DEVELOP";

interface WorkflowStep {
  step: string;
  title: string;
  desc: string;
  illustrationType: string;
}

const WORKFLOW_DATA: Record<WorkflowKey, WorkflowStep[]> = {
  SELL: [
    {
      step: "01",
      title: "CAPTURE",
      desc: "Sign the mandate. Upload the title deed. Set the asking price. Done in under 2 minutes.",
      illustrationType: "mandate",
    },
    {
      step: "02",
      title: "MANAGE",
      desc: "Track every viewing. Monitor every offer. WhatsApp follows up automatically — you don't chase, Contour does.",
      illustrationType: "viewing",
    },
    {
      step: "03",
      title: "CLOSE",
      desc: "Offer accepted. Commission locked at 5%. Deed of sale generated. Registry updated. Agent paid.",
      illustrationType: "ledger",
    },
  ],
  RENT: [
    {
      step: "01",
      title: "LIST",
      desc: "Upload the rental listing. Set monthly rate, security deposit, and tenancy rules. Live across channels in 90s.",
      illustrationType: "rent-list",
    },
    {
      step: "02",
      title: "SCREEN",
      desc: "Prospective tenants captured via WhatsApp. References checked, Zambian NRC verified automatically.",
      illustrationType: "rent-screen",
    },
    {
      step: "03",
      title: "LEASE",
      desc: "Standard lease agreement electronically executed. Deposit recorded. Automated arrears monitoring active.",
      illustrationType: "rent-lease",
    },
  ],
  LEASE: [
    {
      step: "01",
      title: "MANDATE",
      desc: "Capture commercial office or warehouse specs: lettable area (m²), zoning, and anchor tenant requirements.",
      illustrationType: "comm-mandate",
    },
    {
      step: "02",
      title: "NEGOTIATE",
      desc: "Track every corporate offer, escalation clause, and fit-out period. Complete audit history preserved.",
      illustrationType: "comm-negotiate",
    },
    {
      step: "03",
      title: "EXECUTE",
      desc: "Commercial lease executed. Annual 8% escalation scheduled. Landlord statement auto-generated monthly.",
      illustrationType: "comm-execute",
    },
  ],
  DEVELOP: [
    {
      step: "01",
      title: "SURVEY",
      desc: "Register the parent land parcel. Attach the cadastral survey diagram. Automatically plot subdivided stands.",
      illustrationType: "dev-survey",
    },
    {
      step: "02",
      title: "MARKET",
      desc: "Batch generate stand listings. Syndicate to WhatsApp investor groups. Track deposit reservations live.",
      illustrationType: "dev-market",
    },
    {
      step: "03",
      title: "TRANSFER",
      desc: "Title deeds processed with Ministry of Lands reference numbers. Subdivided stand commissions paid.",
      illustrationType: "dev-transfer",
    },
  ],
};

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<WorkflowKey>("SELL");
  const tabs: WorkflowKey[] = ["SELL", "RENT", "LEASE", "DEVELOP"];
  const currentSteps = WORKFLOW_DATA[activeTab];

  return (
    <section id="how-it-works" className="relative w-full bg-white overflow-hidden">
      <CornerMark position="top-left" className="top-2 left-2" />
      <CornerMark position="top-right" className="top-2 right-2" />

      {/* Header Bar: "HOW IT WORKS" */}
      <div className="w-full border-t border-b border-editorial-border py-3 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-center gap-6">
          <div className="flex-1 h-px bg-editorial-border" />
          <span className="font-geist text-xs font-semibold uppercase tracking-[0.25em] text-editorial-muted whitespace-nowrap">
            HOW IT WORKS
          </span>
          <div className="flex-1 h-px bg-editorial-border" />
        </div>
      </div>

      {/* Headline Framed in 1400px Container */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16 text-center border-x border-editorial-border">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="font-heading font-bold text-4xl sm:text-5xl lg:text-7xl tracking-tighter text-editorial-black uppercase leading-[0.98] [text-wrap:balance]"
        >
          YOUR AGENTS DO WHAT YOU <br />
          TELL THEM. NOTHING MORE.
        </motion.h2>
      </div>

      {/* Workflow Tabs Row (SELL, RENT, LEASE, DEVELOP) Framed in 1400px Container */}
      <div className="w-full border-t border-b border-editorial-border bg-white">
        <div className="max-w-[1400px] mx-auto border-x border-editorial-border">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-editorial-border">
            {tabs.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative py-6 sm:py-8 px-6 text-center transition-colors group ${
                    isActive ? "bg-white" : "hover:bg-neutral-50/80"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`font-heading font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight transition-colors ${
                        isActive ? "text-editorial-black" : "text-editorial-inactive group-hover:text-editorial-black/70"
                      }`}
                    >
                      {tab}
                    </span>
                    {isActive && (
                      <span className="w-2.5 h-2.5 rounded-full bg-editorial-red inline-block mb-4" />
                    )}
                  </div>

                  {/* Red Underline on Active Tab */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-editorial-red"
                      transition={{ duration: 0.3, ease: ease.wipe }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3 Step Flow Columns Framed in 1400px Container */}
      <div className="w-full border-b border-editorial-border bg-white">
        <div className="max-w-[1400px] mx-auto border-x border-editorial-border">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: ease.out }}
              className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-editorial-border"
            >
              {currentSteps.map((s, idx) => (
                <div
                  key={s.step}
                  className="p-8 sm:p-10 flex flex-col justify-between relative group hover:bg-neutral-50/50 transition-colors"
                >
                  {/* Step Header */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-geist font-bold text-5xl sm:text-6xl text-editorial-red">
                        {s.step}
                      </span>
                      <span className="font-heading font-bold text-xl sm:text-2xl text-editorial-black">
                        / {s.title}
                      </span>
                    </div>
                    <p className="font-geist text-xs sm:text-sm text-editorial-muted leading-relaxed min-h-[48px]">
                      {s.desc}
                    </p>
                  </div>

                  {/* Minimal Architectural Illustration Canvas */}
                  <div className="my-8 py-6 px-4 border border-editorial-border bg-white flex items-center justify-center relative overflow-hidden topo-pattern-bg min-h-[220px]">
                    <WorkflowIllustration type={s.illustrationType} />
                  </div>

                  {/* Bottom Step Flow Indicator */}
                  <div className="pt-4 border-t border-editorial-border flex items-center justify-between font-geist text-xs text-editorial-muted">
                    <span>STEP {s.step} OF 03</span>
                    {idx < 2 ? (
                      <span className="text-editorial-black arrow-pulse font-bold text-base">→</span>
                    ) : (
                      <span className="text-editorial-red font-bold">COMPLETE ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Hint Strip Framed in 1400px Container */}
      <div className="w-full border-b border-editorial-border bg-neutral-50/50">
        <div className="max-w-[1400px] mx-auto py-4 text-center border-x border-editorial-border">
          <p className="font-geist text-xs text-editorial-muted px-4">
            Switch between <span className="font-bold text-editorial-black">SELL</span>, <span className="font-bold text-editorial-black">RENT</span>, <span className="font-bold text-editorial-black">LEASE</span>, and <span className="font-bold text-editorial-black">DEVELOP</span> above to see each workflow
          </p>
        </div>
      </div>

      <CornerMark position="bottom-left" className="bottom-2 left-2" />
      <CornerMark position="bottom-right" className="bottom-2 right-2" />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Minimal Architectural Blueprint SVGs for Steps                             */
/* -------------------------------------------------------------------------- */

function WorkflowIllustration({ type }: { type: string }) {
  if (type === "mandate" || type === "comm-mandate") {
    return (
      <div className="w-48 border border-editorial-black p-4 bg-white font-geist text-[10px] space-y-2">
        <div className="border-b border-editorial-black pb-1 font-bold text-center">
          MANDATE / CONTRACT
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="h-2 bg-editorial-border w-full" />
          <div className="h-2 bg-editorial-border w-4/5" />
          <div className="h-2 bg-editorial-border w-3/5" />
        </div>
        <div className="pt-3 border-t border-editorial-border flex items-center justify-between text-editorial-red font-bold">
          <span>SIGNED</span>
          <span className="text-xs">✍</span>
        </div>
      </div>
    );
  }

  if (type === "viewing" || type === "comm-negotiate" || type === "rent-screen") {
    return (
      <div className="w-56 border border-editorial-black p-3 bg-white font-geist text-[10px] space-y-2">
        <div className="flex items-center justify-between border-b border-editorial-border pb-1">
          <span className="font-bold">VIEWING SCHEDULE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-editorial-red" />
        </div>
        <div className="grid grid-cols-5 gap-1 py-1">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className={`h-5 border border-editorial-border flex items-center justify-center ${
                i === 3 || i === 7 || i === 11 ? "bg-editorial-hover border-editorial-red/60" : "bg-neutral-50/50"
              }`}
            >
              {(i === 3 || i === 7 || i === 11) && (
                <span className="w-1.5 h-1.5 rounded-full bg-editorial-red" />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[9px] text-editorial-muted pt-1">
          <span>New → Viewing → Offer</span>
        </div>
      </div>
    );
  }

  if (type === "ledger" || type === "rent-lease" || type === "comm-execute") {
    return (
      <div className="w-48 border border-editorial-black p-3 bg-white font-geist text-[10px] space-y-2">
        <div className="border-b border-editorial-black pb-1 font-bold text-center">
          COMMISSION LEDGER
        </div>
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span>Stand 8942-A</span><span className="font-bold">5%</span></div>
          <div className="flex justify-between"><span>Villa Ibex</span><span className="font-bold">5%</span></div>
          <div className="flex justify-between"><span>Kabulonga</span><span className="font-bold">5%</span></div>
        </div>
        <div className="pt-2 border-t border-editorial-black flex items-center justify-between font-bold text-editorial-red">
          <span>DISBURSED</span>
          <span>✓</span>
        </div>
      </div>
    );
  }

  // Fallback / Development Stand Cadastral Diagram
  return (
    <div className="w-48 border border-editorial-black p-3 bg-white font-geist text-[10px] space-y-2">
      <div className="border-b border-editorial-black pb-1 font-bold text-center">
        CADASTRAL SURVEY
      </div>
      <div className="grid grid-cols-3 gap-1 py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`h-7 border border-editorial-border flex items-center justify-center font-mono text-[8px] ${
              i === 2 || i === 4 ? "bg-editorial-red text-white font-bold" : "bg-neutral-50"
            }`}
          >
            #{i + 1}
          </div>
        ))}
      </div>
      <div className="text-[9px] text-center text-editorial-muted">
        Subdivided Stands
      </div>
    </div>
  );
}
