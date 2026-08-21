"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  FileCheck,
  ChevronDown,
  HelpCircle,
  Sparkles,
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
    <section className="py-20 bg-paper-200/60 border-b border-border" id="faq">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-300 border border-border text-ink-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-contour-emerald" />
            Legal & Data Integrity
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            Institutional Security, POPIA Compliance & FAQ
          </h2>
          <p className="text-sm sm:text-base text-ink-600 mt-3 leading-relaxed">
            Engineered to comply with the Zambian Lands Act, PACRA guidelines, and South African POPIA / FICA data sovereignty standards.
          </p>
        </div>

        {/* 3 Compliance Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          <div className="bg-white rounded-2xl p-6 border border-border shadow-card space-y-2">
            <div className="w-10 h-10 rounded-xl bg-contour-emerald/10 text-contour-emerald flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-ink-900">
              Encrypted Title Deeds Vault
            </h3>
            <p className="text-xs text-ink-600 leading-relaxed">
              AES-256 encrypted custody for Certificates of Title, NRC ID copies, and survey folios with 15-minute expiring download tokens.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-border shadow-card space-y-2">
            <div className="w-10 h-10 rounded-xl bg-contour-amber/10 text-contour-amber flex items-center justify-center mb-3">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-ink-900">
              Immutable POPIA Audit Trail
            </h3>
            <p className="text-xs text-ink-600 leading-relaxed">
              Every document download, client phone reveal, and statement export is permanently logged with user identity, timestamp, and IP address.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-border shadow-card space-y-2">
            <div className="w-10 h-10 rounded-xl bg-contour-red/10 text-contour-red flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-ink-900">
              The DocuSign Human Seam
            </h3>
            <p className="text-xs text-ink-600 leading-relaxed">
              AI calculates ledger deductions and drafts remittance PDFs, but money never moves without explicit sign-off from an authorized broker.
            </p>
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq) => {
            const isOpen = openIds.includes(faq.id);
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-border shadow-card overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-ink-900 hover:text-contour-red transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-contour-red shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-ink-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-contour-red" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-ink-600 leading-relaxed border-t border-paper-200 font-sans">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
