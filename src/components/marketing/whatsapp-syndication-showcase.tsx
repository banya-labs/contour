"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Send,
  Users,
  Bot,
} from "lucide-react";

export function WhatsAppSyndicationShowcase() {
  const [copied, setCopied] = useState(false);

  const sampleFlyerText = `🏛️ *CONTOUR EXCLUSIVE MANDATE* 🏛️

📍 *EXECUTIVE 4-BEDROOM STANDALONE RESIDENCE*
Suburb: Kabulonga, Lusaka
Landmark: 200m off Kabulonga Road, near Centro Mall

💰 Asking Price: *ZMW 3,500,000* ($ 140,000 USD)
📐 Plot Size: 2,400 m² Landscaped Grounds

✨ *Key Features:*
• 4 En-Suite Bedrooms | 3.5 Modern Bathrooms
• Automated 10kVA Solar Inverter System (Zero Load-Shedding)
• High-Yield Submersible Borehole & Water Tanks
• Private Swimming Pool, Double Garage & Staff Quarters
• Clean Title Deed (Ministry of Lands Stand # 8942-A)

📲 *Direct Agent Contact & Viewings:*
Broker: Tembo Mwape (+260 97 1234567)
Agency: Contour Real Estate Operations
🔗 View Full 360° Specs & Map: https://contour.app/p/executive-4-bed-kabulonga

🛡️ _Managed under Exclusive Agency Mandate. Protected by Contour OS._`;

  const handleCopyFlyer = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(sampleFlyerText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section className="py-20 bg-paper-200/50 border-b border-border" id="syndication">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-300 border border-border text-ink-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Share2 className="w-3.5 h-3.5 text-contour-emerald" />
            Omnichannel Syndication & Reverse Matchmaker
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            1-Click WhatsApp Listing Flyers & Automated Buyer Matching
          </h2>
          <p className="text-sm sm:text-base text-ink-600 mt-3 leading-relaxed">
            Turn messy camera roll photos into professionally formatted WhatsApp share cards with clean links, verified specs, and masked landlord contacts.
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Left: The Chaotic Way */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-7 border border-red-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-red-100">
              <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4" />
                <span>The Chaotic Way (Manual WhatsApp)</span>
              </div>
              <span className="text-[11px] font-mono text-red-500 bg-red-50 px-2 py-0.5 rounded">
                High Leakage
              </span>
            </div>

            {/* Chat Simulation */}
            <div className="bg-paper-100 rounded-xl p-4 border border-border font-sans space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[10px] text-ink-400">
                <Users className="w-3.5 h-3.5" />
                <span>Lusaka Real Estate Agents Group (842 members)</span>
              </div>

              <div className="bg-red-50/70 border border-red-200/60 rounded-xl p-3.5 space-y-2 text-ink-800">
                <div className="text-[10px] font-bold text-red-700">Agent Phone Gallery Drop:</div>
                <p className="text-xs leading-relaxed text-ink-800">
                  <em>&quot;House in kabulonga for sale 4bed swimming pool. Big yard. Call owner Mr. Hastings on +260971889900 directly for keys and viewings. Urgent sale!!&quot;</em>
                </p>
                <div className="text-[10px] text-red-600 font-medium pt-1 border-t border-red-200/50">
                  ❌ Landlord personal phone exposed • ❌ Commission easily bypassed • ❌ Zero specs or title info
                </div>
              </div>
            </div>

            <div className="text-xs text-ink-600 space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-red-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Landlord PII leaked to competing brokerages</span>
              </div>
              <div className="flex items-center gap-2 text-red-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>No trackable link or high-resolution photo gallery</span>
              </div>
            </div>
          </div>

          {/* Right: The Contour Way */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-7 border-2 border-contour-emerald/60 shadow-floating space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2 text-contour-emerald font-bold text-xs uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4" />
                <span>The Contour Way (1-Click Flyer)</span>
              </div>
              <button
                type="button"
                onClick={handleCopyFlyer}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-subtle ${
                  copied
                    ? "bg-contour-emerald text-white"
                    : "bg-contour-dark hover:bg-ink-950 text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy WhatsApp Flyer</span>
                  </>
                )}
              </button>
            </div>

            {/* Structured Flyer Preview Box */}
            <div className="bg-[#e9f7ef] rounded-xl p-4 border border-emerald-200/80 font-mono text-[11px] text-ink-900 leading-relaxed whitespace-pre-wrap max-h-[220px] overflow-y-auto">
              {sampleFlyerText}
            </div>

            <div className="text-xs text-ink-600 space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-contour-emerald font-semibold">
                <Check className="w-3.5 h-3.5 text-contour-emerald" />
                <span>Landlord PII strictly masked (Protected Agency Mandate)</span>
              </div>
              <div className="flex items-center gap-2 text-contour-emerald font-semibold">
                <Check className="w-3.5 h-3.5 text-contour-emerald" />
                <span>Direct link to verified 360° property card & Leaflet map</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Dual Pillars: Reverse Matchmaker & Website Syndication */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: AI Reverse Matchmaker */}
          <div className="bg-white rounded-2xl p-6 border border-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-contour-amber/10 text-contour-amber flex items-center justify-center shrink-0">
                  <Bot className="w-5.5 h-5.5" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-contour-amber/10 text-contour-amber text-[9px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Agent
                  </div>
                  <h3 className="text-sm font-bold text-ink-900">
                    Instant Buyer Cross-Referencing
                  </h3>
                </div>
              </div>
              <p className="text-xs text-ink-600 leading-relaxed">
                When you list a new property in Contour, it automatically cross-references all registered buyers and drafts personalized WhatsApp alert messages to qualified clients within seconds.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-paper-200 hover:bg-paper-300 text-ink-900 text-xs font-semibold transition-colors flex items-center justify-between w-full mt-2"
            >
              <span>See Matchmaker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Website REST API Sync */}
          <div className="bg-white rounded-2xl p-6 border border-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-contour-emerald/10 text-contour-emerald flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-contour-emerald/10 text-contour-emerald text-[9px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-2.5 h-2.5" />
                    Developer API
                  </div>
                  <h3 className="text-sm font-bold text-ink-900">
                    Auto-Sync Corporate Website
                  </h3>
                </div>
              </div>
              <p className="text-xs text-ink-600 leading-relaxed">
                Showcase available listings dynamically on your own website. Mark properties as Sold or Rented in Contour and watch them update on your site instantly. Capture leads back into your CRM automatically.
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="px-4 py-2 rounded-lg bg-paper-200 hover:bg-paper-300 text-ink-900 text-xs font-semibold transition-colors flex items-center justify-between w-full mt-2"
            >
              <span>View API Docs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
