"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-editorial-black font-geist antialiased selection:bg-contour-red selection:text-white">
      {/* Header */}
      <header className="border-b border-editorial-border bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-editorial-muted hover:text-editorial-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Contour Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono bg-editorial-bg text-editorial-black px-2 py-0.5 rounded-none border border-editorial-border uppercase">
              Zambia DPA No. 3 of 2021
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-editorial-border bg-editorial-bg py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-editorial-border text-contour-red rounded-none text-xs font-mono uppercase tracking-wider mb-4">
            <Scale className="w-3.5 h-3.5 text-contour-red" />
            <span>Statutory Privacy Declaration</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-bold uppercase tracking-wider text-editorial-black">
            Privacy Policy & Data Protection Declaration
          </h1>
          <p className="mt-3 text-xs font-mono text-editorial-muted max-w-2xl leading-relaxed">
            Effective Date: 10 September 2026 · Governed by the Laws of the Republic of Zambia · Supervised by the Office of the Data Protection Commissioner (ODPC), Lusaka.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-editorial-black text-xs leading-relaxed">
        {/* Overview Box */}
        <div className="p-5 bg-white rounded-none border-l-2 border-contour-red border-y border-r border-editorial-border space-y-2">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-contour-red">
            Regulatory Compliance Commitment
          </h3>
          <p className="text-xs text-editorial-muted leading-relaxed">
            Contour Real Estate Operations System (&ldquo;Contour&rdquo;, operated by Banya Labs) is engineered from the ground up to uphold the highest standards of data sovereignty under the <strong>Zambia Data Protection Act No. 3 of 2021 (DPA)</strong>, the <strong>Electronic Communications and Transactions (ECT) Act No. 4 of 2021</strong>, and the <strong>Lands and Deeds Registry Act (Cap 185)</strong>.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">01.</span>
            Data Controller & Data Processor Roles
          </h2>
          <p className="text-editorial-black">
            Under Section 15 of the Zambia DPA 2021:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-editorial-muted">
            <li>
              <strong className="text-editorial-black">The Real Estate Agency:</strong> Functions as the primary <strong>Data Controller</strong> responsible for collecting personal data from clients, specifying the conveyancing or tenancy purpose, and determining lawful processing grounds.
            </li>
            <li>
              <strong className="text-editorial-black">Contour (Banya Labs):</strong> Functions as the specialized <strong>Data Processor</strong> providing multi-tenant encrypted cloud infrastructure, document vaults, and automated workflows on behalf of the Data Controller.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">02.</span>
            Categories of Personal Data Collected
          </h2>
          <p className="text-editorial-black">
            In the ordinary course of real estate conveyancing, leasing, and agency management, Contour processes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-none border border-editorial-border bg-white">
              <h4 className="font-heading font-bold uppercase text-xs text-editorial-black mb-1">Standard Personal Data</h4>
              <p className="text-xs text-editorial-muted">
                Full legal names, email addresses, WhatsApp telephone numbers, residential physical addresses, and tax identifiers (TPIN).
              </p>
            </div>
            <div className="p-4 rounded-none border border-editorial-border bg-[#fff5f3]">
              <h4 className="font-heading font-bold uppercase text-xs text-contour-red mb-1">Sensitive Personal Data (§22)</h4>
              <p className="text-xs text-editorial-muted">
                National Registration Card (NRC) numbers, biometric passport scans, Certificate of Title deeds, stand survey diagrams, and bank account remittance details.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">03.</span>
            Legal Grounds for Processing (Section 21)
          </h2>
          <p className="text-editorial-black">
            We process your personal information strictly under one or more of the following lawful grounds:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-editorial-muted">
            <li><strong className="text-editorial-black">Contractual Necessity:</strong> Essential to execute tenancy agreements, sole mandate sales, and property conveyance.</li>
            <li><strong className="text-editorial-black">Statutory Obligation:</strong> Compliance with the Financial Intelligence Centre (FIC) Act for Anti-Money Laundering (AML) diligence and Zambia Revenue Authority (ZRA) audit reporting.</li>
            <li><strong className="text-editorial-black">Explicit Digital Consent:</strong> Captured prior to client document upload via tokenized links with timestamp, client IP, and user-agent logging.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">04.</span>
            Statutory 7-Year Retention & Archival Policy (Section 26)
          </h2>
          <p className="text-editorial-black">
            Real estate transaction documentation (including Title Deeds, NRC scans, and signed leases) is retained for <strong>seven (7) years</strong> following the completion of a transaction or lease termination, matching Zambian tax and property audit standards.
          </p>
          <div className="p-3.5 bg-editorial-bg rounded-none border border-editorial-border text-xs text-editorial-muted">
            <strong className="text-editorial-black font-mono uppercase">Archived Listing Protection:</strong> When a property listing is marked archived or deleted, its document vault enters a custodial read-only state. Uploads and deletions are locked, while documents remain accessible for authorized legal verification.
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">05.</span>
            Security Measures & 15-Minute Presigned Tokens
          </h2>
          <p className="text-editorial-black">
            Contour employs technical and organizational safeguards complying with Section 27 of the DPA:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-editorial-muted">
            <li><strong className="text-editorial-black">AES-256 Bucket Encryption:</strong> All binary files reside in self-hosted, tenant-partitioned MinIO S3 storage buckets.</li>
            <li><strong className="text-editorial-black">Zero Permanent Download URLs:</strong> Document access is strictly governed by single-use, 15-minute presigned URLs that expire automatically.</li>
            <li><strong className="text-editorial-black">Immutable Audit Logs:</strong> Every document view, upload, download, and verification event is recorded in an immutable ledger with masked PII.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">06.</span>
            Your Data Subject Rights (Sections 28–33)
          </h2>
          <p className="text-editorial-black">
            As a data subject in Zambia, you possess the legal right to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-editorial-muted">
            <li><strong className="text-editorial-black">Right of Access (DSAR):</strong> Request a complete export of all personal data held about you by contacting your agent or via our DSAR endpoint.</li>
            <li><strong className="text-editorial-black">Right to Rectification:</strong> Request correction of inaccurate NRC, passport, or contact information.</li>
            <li><strong className="text-editorial-black">Right to Erasure:</strong> Request deletion of data subject to mandatory statutory retention under conveyancing laws.</li>
            <li><strong className="text-editorial-black">Right to Withdraw Consent:</strong> Cancel pending upload invitations before files are uploaded.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">07.</span>
            Regulatory Oversight & Lodging Complaints
          </h2>
          <p className="text-editorial-black">
            If you believe your personal information has been processed in violation of the Zambia Data Protection Act, you have the statutory right to file a complaint with the regulatory authority:
          </p>
          <div className="p-4 rounded-none border border-editorial-border bg-editorial-bg text-xs space-y-1 font-mono text-editorial-black">
            <div className="font-bold text-editorial-black">Office of the Data Protection Commissioner (ODPC)</div>
            <div>Ministry of Technology and Science</div>
            <div>Lusaka, Republic of Zambia</div>
            <div>Website: <a href="https://www.dataprotection.gov.zm" target="_blank" rel="noopener noreferrer" className="text-contour-red underline">dataprotection.gov.zm</a></div>
          </div>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
