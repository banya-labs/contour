import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Cookie, ShieldCheck, Database, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie & Technical Storage Notice (Zambia DPA § 21)",
  description:
    "Statutory disclosure of essential cookies, session storage, and offline SQLite synchronization for Contour under the Zambia Data Protection Act.",
  alternates: {
    canonical: "/cookies",
  },
};

export default function CookiePolicyPage() {
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
              Zambia DPA 2021 § 21
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-editorial-border bg-editorial-bg py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-editorial-border text-contour-red rounded-none text-xs font-mono uppercase tracking-wider mb-4">
            <Cookie className="w-3.5 h-3.5 text-contour-red" />
            <span>Statutory Disclosure</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-bold uppercase tracking-wider text-editorial-black">
            Cookie & Storage Notice
          </h1>
          <p className="mt-3 text-xs font-mono text-editorial-muted max-w-2xl leading-relaxed">
            Effective Date: 10 September 2026 · Governed by the Laws of the Republic of Zambia · Supervised by the Office of the Data Protection Commissioner (ODPC).
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-editorial-black text-xs leading-relaxed">
        {/* Preamble */}
        <div className="p-5 bg-white rounded-none border-l-2 border-contour-red border-y border-r border-editorial-border space-y-2">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-contour-red">
            Essential Operations & Zero Tracking Guarantee
          </h3>
          <p className="text-xs text-editorial-muted leading-relaxed">
            Contour does not engage in behavioural profiling, cross-site tracking, or sell user data to advertising networks. All cookies, local storage keys, and offline SQLite WASM caches utilized by Contour are <strong>strictly essential</strong> to enforce multi-tenant isolation, safeguard NRC and Title Deed vaults, and enable offline-first field synchronization during power outages.
          </p>
        </div>

        {/* Section 1: Cookie & Storage Inventory Table */}
        <section className="space-y-4">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">01.</span>
            Technical Storage Inventory
          </h2>
          <p className="text-editorial-black">
            The following storage artifacts are set on your device when using Contour:
          </p>

          <div className="border border-editorial-border overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-editorial-bg border-b border-editorial-border text-editorial-black uppercase">
                <tr>
                  <th className="p-2.5">Identifier</th>
                  <th className="p-2.5">Storage Mechanism</th>
                  <th className="p-2.5">Purpose</th>
                  <th className="p-2.5">Lifespan</th>
                  <th className="p-2.5">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-editorial-border">
                <tr>
                  <td className="p-2.5 font-bold">better-auth.session_token</td>
                  <td className="p-2.5 text-editorial-muted">HTTP-Only Cookie (Secure)</td>
                  <td className="p-2.5 text-editorial-muted">Cryptographic authentication and organization tenant binding</td>
                  <td className="p-2.5 text-editorial-muted">30 Days</td>
                  <td className="p-2.5 text-contour-red font-bold">Strictly Essential</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">contour_dpa_consent</td>
                  <td className="p-2.5 text-editorial-muted">Browser LocalStorage</td>
                  <td className="p-2.5 text-editorial-muted">Records user statutory consent under Zambia DPA 2021</td>
                  <td className="p-2.5 text-editorial-muted">1 Year</td>
                  <td className="p-2.5 text-contour-red font-bold">Strictly Essential</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">powersync_db (SQLite WASM)</td>
                  <td className="p-2.5 text-editorial-muted">IndexedDB / WASM SQLite</td>
                  <td className="p-2.5 text-editorial-muted">Local property & map replica for offline field agent execution</td>
                  <td className="p-2.5 text-editorial-muted">Persistent</td>
                  <td className="p-2.5 text-contour-red font-bold">Strictly Essential</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">upload_pin_session</td>
                  <td className="p-2.5 text-editorial-muted">Session Storage</td>
                  <td className="p-2.5 text-editorial-muted">Locks KYC upload portal after PIN challenge verification</td>
                  <td className="p-2.5 text-editorial-muted">Session (2 Hours)</td>
                  <td className="p-2.5 text-contour-red font-bold">Security / Essential</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Offline SQLite Replication */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">02.</span>
            Offline-First Local Storage (PowerSync WASM)
          </h2>
          <p className="text-editorial-black">
            To provide continuous real estate operational capability in Zambia despite load shedding and intermittent telecom networks, Contour replicates your agency&apos;s authorized property data and work queues to an encrypted, client-side SQLite database in your browser.
          </p>
          <div className="p-4 rounded-none border border-editorial-border bg-editorial-bg text-xs space-y-2">
            <div className="flex items-center gap-2 text-editorial-black font-heading font-bold uppercase">
              <Database className="w-4 h-4 text-contour-red" />
              <span>Client-Side Data Isolation</span>
            </div>
            <p className="text-editorial-muted">
              Local SQLite data is scoped strictly to your authenticated session. If you log out or if your member role is revoked, local database keys are wiped automatically from your browser storage.
            </p>
          </div>
        </section>

        {/* Section 3: Third-Party Trackers & Advertising */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">03.</span>
            Third-Party Pixels & Ad Networks
          </h2>
          <p className="text-editorial-black">
            Contour guarantees that:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-editorial-muted">
            <li>We do not deploy Meta/Facebook Pixels, Google Tag Manager advertising tags, TikTok trackers, or third-party behavioral beacons.</li>
            <li>We do not share your browsing habits, searched properties, or lease values with data brokers or marketing intermediaries.</li>
            <li>All telemetry captured in our <code className="font-mono text-editorial-black">AuditLog</code> and <code className="font-mono text-editorial-black">AiUsageLog</code> tables is strictly first-party operational data used for POPIA/DPA compliance and token accounting.</li>
          </ul>
        </section>

        {/* Section 4: Managing Consent */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-2">
            <span className="text-contour-red font-mono text-sm">04.</span>
            Managing Your Preferences
          </h2>
          <p className="text-editorial-black">
            Because all cookies and storage mechanisms utilized are strictly necessary to deliver the service and uphold data protection statutory covenants, disabling cookies in your browser settings will prevent authentication and disable the property document vault.
          </p>
          <p className="text-editorial-muted">
            To clear your local session, click &quot;Sign Out&quot; from the dashboard settings or clear your browser&apos;s site data for <code className="font-mono text-editorial-black">contour.co.zm</code>.
          </p>
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
