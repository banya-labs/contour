"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Check } from "lucide-react";

export function MonolithicFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
    }
  };

  return (
    <footer className="bg-[#0B0F0C] text-white pt-24 pb-12 overflow-hidden relative border-t border-white/10">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#E57A1A]/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Newsletter & Conversion Banner */}
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-12 mb-20 backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <span className="text-xs font-mono uppercase tracking-widest text-[#E57A1A] font-bold">
              Private Real Estate Dispatch
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
              Subscribe to Contour Private Mandates
            </h3>
            <p className="text-stone-400 text-xs sm:text-sm mt-2 leading-relaxed font-normal">
              Receive confidential off-market estate listings, diplomatic rental opportunities, and quarterly Lusaka price comps directly in your inbox.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
            {subscribed ? (
              <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow">
                <Check className="w-4 h-4" />
                <span>You’re subscribed to Private Mandates</span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-[#E57A1A] w-full sm:w-72"
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-full bg-[#FAF8F5] text-[#141715] hover:bg-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 group"
                >
                  <span>Join List</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}
          </form>
        </div>

        {/* Main 4-Column Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 text-xs">
          <div>
            <h4 className="text-stone-300 font-mono uppercase tracking-widest font-bold mb-4">
              Prime Properties
            </h4>
            <ul className="space-y-2.5 text-stone-400 font-medium">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Kabulonga Estates
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Leopards Hill Acreage
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Roma Park Enclaves
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Woodlands Diplomatic Leases
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Commercial Development Land
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-stone-300 font-mono uppercase tracking-widest font-bold mb-4">
              Real Estate OS
            </h4>
            <ul className="space-y-2.5 text-stone-400 font-medium">
              <li>
                <Link href="/dashboard/sales" className="hover:text-white transition-colors">
                  Title & Sales Registry
                </Link>
              </li>
              <li>
                <Link href="/dashboard/leases" className="hover:text-white transition-colors">
                  Diplomatic Lease Nudges
                </Link>
              </li>
              <li>
                <Link href="/dashboard/statements" className="hover:text-white transition-colors">
                  Landlord Statement Engine
                </Link>
              </li>
              <li>
                <Link href="/kiosk" className="hover:text-[#E57A1A] transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Offline Field PWA</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/documents" className="hover:text-white transition-colors">
                  MinIO Legal Custody Vault
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-stone-300 font-mono uppercase tracking-widest font-bold mb-4">
              Governance & Legal
            </h4>
            <ul className="space-y-2.5 text-stone-400 font-medium">
              <li>
                <Link href="/admin/mcp" className="hover:text-white transition-colors">
                  MCP Studio & API Keys
                </Link>
              </li>
              <li>
                <span className="text-stone-500">POPIA Data Sovereignty</span>
              </li>
              <li>
                <span className="text-stone-500">PACRA Registration Custody</span>
              </li>
              <li>
                <span className="text-stone-500">Ministry of Lands Verifications</span>
              </li>
              <li>
                <span className="text-stone-500">5% Transparent Commission Lock</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-stone-300 font-mono uppercase tracking-widest font-bold mb-4">
              Banya Labs Studio
            </h4>
            <ul className="space-y-2.5 text-stone-400 font-medium">
              <li>
                <span className="text-stone-300 font-semibold">Lusaka HQ:</span>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  Stand 2374, Great East Road, Lusaka, Zambia
                </p>
              </li>
              <li className="pt-2">
                <span className="text-stone-300 font-semibold">Inquiries:</span>
                <p className="text-stone-500 text-[11px] font-mono mt-0.5">
                  concierge@contour-os.com
                </p>
              </li>
              <li className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 text-[11px] font-bold transition-colors"
                >
                  <span>Operator Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Massive Monolithic Typography Brand Anchor */}
        <div className="border-t border-white/10 pt-12 pb-8 text-center select-none">
          <div className="text-[14vw] font-serif font-black tracking-tighter leading-none text-white/[0.07] hover:text-white/[0.12] transition-colors duration-500">
            CONTOUR
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-500 border-t border-white/5 pt-8 gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>© 2026 Contour Real Estate OS • Powered by Banya Labs</span>
          </div>

          <div className="flex items-center gap-6">
            <span>POPIA & PACRA Sovereign</span>
            <span>•</span>
            <span>Paystack Certified</span>
            <span>•</span>
            <span>PowerSync Offline Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
