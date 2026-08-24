"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  FileCheck,
  ChevronDown,
  HelpCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "How does Contour function in the field during ZESCO load-shedding?",
    answer:
      "Contour's Field Companion (/kiosk) is built as an offline-first Progressive Web App (PWA) powered by PowerSync and local SQLite WASM. All property specs, stand boundaries, landmark directions, and client contacts are cached locally on the agent's smartphone, allowing full offline operation during 8–12 hour power outages in Lusaka, Ndola, or Harare.",
  },
  {
    id: "faq-2",
    question: "How does Contour separate gross transaction value from real agency revenue?",
    answer:
      "Unlike generic CRMs that display misleading gross pipeline numbers, Contour applies Southern African brokerage mathematics: it isolates the 5% agency sales commission from gross asset values and calculates the 50/50 closing agent splits and net retained brokerage revenue in real time.",
  },
  {
    id: "faq-3",
    question: "What stops rogue agents from poaching clients or dealing directly with landlords?",
    answer:
      "Contour enforces two strict cryptographic controls: (1) 30-Day Anti-Poaching Client Custody, where registered buyer and tenant inquiries are locked exclusively to the registering broker, and (2) Masked Landlord PII, which hides landlord mobile numbers from public flyers and competing agents.",
  },
  {
    id: "faq-4",
    question: "How are landlord monthly rental remittances calculated?",
    answer:
      "At month-end, Contour aggregates collected rent, automatically deducts your 10% agency management fee, subtracts itemized maintenance receipts (borehole pump servicing, solar inverter repairs), and prepares a reconciled statement for human approval before bank transfer via The DocuSign Seam.",
  },
  {
    id: "faq-5",
    question: "What payment methods are supported for our Contour subscription?",
    answer:
      "We integrate directly with Paystack to accept Zambian Kwacha (ZMW) via Mobile Money (MTN MoMo, Airtel Money, Zamtel) and credit/debit cards, as well as US Dollar (USD) international cards with instant VAT tax receipts.",
  },
  {
    id: "faq-6",
    question: "How does Contour protect confidential Title Deeds and NRC ID scans?",
    answer:
      "All conveyancing documents (Ministry of Lands White Paper folios, cadastral survey diagrams, buyer/seller National Registration Cards) are encrypted at rest with AES-256 and served via 15-minute expiring presigned tokens in accordance with the Zambian Data Protection Act No. 3 of 2021 and South African POPIA.",
  },
];

export function PopiaFaqAccordion() {
  const [openIds, setOpenIds] = useState<string[]>(["faq-1"]);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16382B]/10 border border-[#16382B]/15 text-[#16382B] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span>LEGAL CUSTODY & DATA INTEGRITY</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#16382B] tracking-tight">
          Institutional Security, POPIA & FAQ
        </h2>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
          Engineered to comply with the Zambian Lands Act, PACRA guidelines, and South African POPIA / FICA data sovereignty standards.
        </p>
      </div>

      {/* 3 Compliance Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E0D4] shadow-xs space-y-3 hover:border-[#C89B3C]/50 transition-colors">
          <div className="w-10 h-10 rounded-2xl bg-[#16382B]/10 text-[#16382B] flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#C89B3C]" />
          </div>
          <h3 className="font-serif font-bold text-base text-[#16382B]">
            Encrypted Title Deeds Vault
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            AES-256 encrypted custody for Certificates of Title, NRC ID copies, and survey folios with 15-minute expiring download tokens.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E0D4] shadow-xs space-y-3 hover:border-[#C89B3C]/50 transition-colors">
          <div className="w-10 h-10 rounded-2xl bg-[#16382B]/10 text-[#16382B] flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-[#C89B3C]" />
          </div>
          <h3 className="font-serif font-bold text-base text-[#16382B]">
            Immutable POPIA Audit Trail
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Every document download, client phone reveal, and statement export is permanently logged with user identity, timestamp, and IP address.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E0D4] shadow-xs space-y-3 hover:border-[#C89B3C]/50 transition-colors">
          <div className="w-10 h-10 rounded-2xl bg-[#16382B]/10 text-[#16382B] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#C89B3C]" />
          </div>
          <h3 className="font-serif font-bold text-base text-[#16382B]">
            The DocuSign Human Seam
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            AI calculates ledger deductions and drafts remittance PDFs, but money never moves without explicit sign-off from an authorized broker.
          </p>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3 max-w-4xl mx-auto">
        {FAQS.map((faq) => {
          const isOpen = openIds.includes(faq.id);
          return (
            <div
              key={faq.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-white border-[#C89B3C]/50 shadow-sm"
                  : "bg-white/80 border-[#E6E0D4] hover:bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                aria-expanded={isOpen}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-[#16382B] hover:text-[#C89B3C] transition-colors"
              >
                <span className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E6E0D4] flex items-center justify-center text-[11px] font-bold text-[#16382B] shrink-0 font-mono">
                    ?
                  </span>
                  <span className="font-serif text-sm sm:text-base font-bold text-[#16382B]">{faq.question}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-[#C89B3C]" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 sm:px-6 pb-6 pt-0 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-[#FAF8F5]">
                  <p className="pt-3">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
