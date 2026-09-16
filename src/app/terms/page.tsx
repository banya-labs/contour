import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";

export const metadata: Metadata = {
  title: "Terms of Use & Service Agreement (ECT Act No. 4 of 2021)",
  description:
    "Commercial operating agreement and binding terms of service for Contour Real Estate Operations System in the Republic of Zambia.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-white text-editorial-black font-geist antialiased selection:bg-contour-red selection:text-white">
      {/* Header */}
      <header className="border-b border-editorial-border bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-editorial-muted hover:text-editorial-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Contour Home</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="h-4 w-px bg-editorial-border hidden sm:block" />
            <Link href="/" className="inline-flex items-center">
              <ContourLogo size="sm" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono bg-editorial-bg text-editorial-black px-2 py-0.5 rounded-none border border-editorial-border uppercase">
              ECT Act No. 4 of 2021
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-editorial-border bg-editorial-bg py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-editorial-border text-contour-red rounded-none text-xs font-mono uppercase tracking-wider mb-4">
            <Scale className="w-3.5 h-3.5 text-contour-red" />
            <span>Commercial Operating Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-bold uppercase tracking-wider text-editorial-black">
            Terms of Use & Service Agreement
          </h1>
          <p className="mt-3 text-xs font-mono text-editorial-muted max-w-2xl leading-relaxed">
            Effective Date: 10 September 2026 · Governed by the Laws of the Republic of Zambia · Seated in the High Court of Zambia (Commercial Division).
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-editorial-black text-xs leading-relaxed">
        {/* Preamble */}
        <div className="p-5 bg-white rounded-none border-l-2 border-contour-red border-y border-r border-editorial-border space-y-2">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-contour-red">
            Binding Contract & Electronic Assent
          </h3>
          <p className="text-xs text-editorial-muted leading-relaxed">
            By accessing Contour, using the agent control suite, or submitting verification documentation through our client upload portal, you enter into a legally binding agreement under Section 30 of the <strong>Electronic Communications and Transactions (ECT) Act No. 4 of 2021</strong> of the Republic of Zambia.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">01.</span>
            Permitted Use & Real Estate Scope
          </h2>
          <p className="text-editorial-black">
            Contour is a specialized enterprise platform for licensed real estate brokerages, negotiators, landlords, and property clients in Southern Africa. You agree to use the platform exclusively for legitimate property transactions, tenancy management, mandate administration, and compliance diligence.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">02.</span>
            Title Deeds & Ministry of Lands Custody Disclaimer
          </h2>
          <p className="text-editorial-black">
            Digital copies of Certificates of Title, Ministry of Lands folios, and boundary diagrams stored in Contour provide secure operational reference and audit trails. However:
          </p>
          <div className="p-4 rounded-none border border-editorial-border bg-[#fff5f3] text-xs text-editorial-black leading-relaxed">
            <strong className="text-contour-red font-mono uppercase tracking-wider">Statutory Disclaimer (Lands & Deeds Registry Act, Cap 185):</strong> Digital storage in Contour does not constitute or replace statutory registration with the Registrar of Lands and Deeds. Physical execution, stamping, and official registry lodgement remain governed by the Ministry of Lands and Natural Resources of Zambia.
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">03.</span>
            Client Document Upload Warranties
          </h2>
          <p className="text-editorial-black">
            When utilizing the secure Client Upload Portal (`/upload/[token]`):
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-editorial-muted">
            <li>You warrant that all uploaded National Registration Cards (NRC), passport scans, utility bills, and Pacra documents are genuine and unmanipulated.</li>
            <li>You represent that you possess legal authority to furnish the documentation for the associated real estate transaction.</li>
            <li>Uploading fraudulent, forged, or unauthorized third-party documents constitutes an offense under the Penal Code Act (Cap 87) and will be reported to law enforcement.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">04.</span>
            Tenant Data Sovereignty & Anti-Poaching Guarantee
          </h2>
          <p className="text-editorial-black">
            Contour guarantees strict multi-tenant isolation:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-editorial-muted">
            <li><strong className="text-editorial-black">Zero Cross-Tenant Leakage:</strong> Your agency&apos;s listings, landlord records, commission splits, and client data are never accessible to competitor agencies.</li>
            <li><strong className="text-editorial-black">Zero Commercial Exploitation:</strong> Contour does not sell, license, or use your private property documents to train public commercial AI models.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">05.</span>
            Archived Listing Custodial Lock Policy
          </h2>
          <p className="text-editorial-black">
            In compliance with statutory tax and conveyancing retention requirements (Zambia DPA Section 26):
          </p>
          <p className="text-editorial-muted">
            When a property listing is terminated, sold, or archived, its document vault enters an immutable, read-only custodial state for seven (7) years. New files cannot be added, and existing files cannot be altered or deleted, ensuring permanent auditability for ZRA and property regulatory checks.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">06.</span>
            Limitation of Liability & Infrastructure Realities
          </h2>
          <p className="text-editorial-black">
            Contour is engineered with PowerSync offline-first replication to withstand local power outages (load shedding) and spotty connectivity. However, Contour shall not be held liable for conveyancing losses resulting from national telecommunications failures, power grid disruptions, or third-party bank settlement delays.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">07.</span>
            Governing Law & Arbitration in Lusaka
          </h2>
          <p className="text-editorial-black">
            This agreement is governed by the laws of the Republic of Zambia. Any dispute that cannot be resolved amicably within 14 days shall be referred to final and binding arbitration in Lusaka under the <strong>Arbitration Act No. 19 of 2000 of Zambia</strong>, conducted in English by an arbitrator appointed by the Chartered Institute of Arbitrators (Zambia Branch).
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">08.</span>
            B2B SaaS Subscription Billing, Auto-Renewals & Suspension
          </h2>
          <p className="text-editorial-black">
            Contour offers tiered agency subscriptions (Starter, Growth, Enterprise) billed monthly or annually in Zambian Kwacha (ZMW) or United States Dollars (USD) processed via authorized gateways (Paystack and Lenco):
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-editorial-muted">
            <li><strong className="text-editorial-black">Recurring Billing:</strong> Subscriptions automatically renew at the close of each billing cycle unless cancelled prior to renewal via the billing portal.</li>
            <li><strong className="text-editorial-black">Non-Refundable Fees:</strong> Invoiced SaaS seat licenses and vault storage allocations are non-refundable once provisioned.</li>
            <li><strong className="text-editorial-black">Payment Default & Grace Period:</strong> If payment fails, your workspace enters a seven (7) day grace period. Accounts remaining in default after seven days are switched to read-only custodial mode. Data is retained pursuant to our 7-year conveyancing retention policy.</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">09.</span>
            Service Level Expectations & PowerSync Load-Shedding Resilience
          </h2>
          <p className="text-editorial-black">
            Contour is purpose-built for Southern African infrastructure realities:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-editorial-muted">
            <li><strong className="text-editorial-black">Zero-Latency Offline Execution:</strong> Field agent kiosks and tablets operate with client-side local SQLite (PowerSync WASM), ensuring full viewing, capture, and listing generation during national ZESCO power outages and mobile network dropouts.</li>
            <li><strong className="text-editorial-black">Cloud Synchronization SLA:</strong> Cloud syncing operates on best-effort commercial standards during public utility downtime. Once internet connectivity is restored, mutations queued in the local outbox automatically reconcile with the primary PostgreSQL database with idempotent verification.</li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-editorial-border py-8 text-center text-xs font-mono text-editorial-muted">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© 2026 Contour · Part of Banya Labs · Republic of Zambia</div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-editorial-black underline">
              Terms of Use
            </Link>
            <Link href="/privacy" className="hover:text-editorial-black underline">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="hover:text-editorial-black underline">
              Cookie Notice
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
