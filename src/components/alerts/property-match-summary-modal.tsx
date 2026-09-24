"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  Clock,
  Send,
  Copy,
  Check,
  Building2,
  MapPin,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Share2,
} from "lucide-react";
import { AlertMatchResult } from "@/lib/alerts/matchmaker";
import { formatCurrency } from "@/lib/utils";

type PropertyMatchSummaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  matches: AlertMatchResult[];
};

export default function PropertyMatchSummaryModal({
  isOpen,
  onClose,
  property,
  matches,
}: PropertyMatchSummaryModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [deliveredStatus, setDeliveredStatus] = useState<{ [key: string]: boolean }>({});

  if (!isOpen || !property) return null;

  const handleCopyOffer = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleDelivered = (matchId: string) => {
    setDeliveredStatus((prev) => ({
      ...prev,
      [matchId]: !prev[matchId],
    }));
  };

  const isSale = property.listingType === "FOR_SALE";
  const price = isSale ? property.askingPrice : property.rentalPrice;

  return (
    <div className="fixed inset-0 z-[2200] bg-[#282828]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-none border border-[#e0e0e0] shadow-none flex flex-col overflow-hidden w-full max-w-3xl max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-[#e0e0e0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-[#fa3600] text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-[#fa3600] uppercase tracking-widest">
                  [MATCH-01]
                </span>
                <h3 className="font-heading font-bold text-base text-[#282828] uppercase tracking-tight">
                  Reverse-Match Engine Triggered
                </h3>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-none bg-[#fff5f3] text-[#fa3600] border border-[#fa3600]/30 uppercase">
                  {matches.length} Matching Buyer{matches.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#6b6b6b] mt-0.5">
                Automated WhatsApp alerts dispatched. You can also reach out manually with customized offers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-none border border-[#e0e0e0] bg-white text-[#282828] hover:bg-[#282828] hover:text-white transition-all shadow-xs"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. Newly Added Property Card Banner */}
          <div className="p-4 rounded-none bg-neutral-50 border border-[#e0e0e0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-none overflow-hidden bg-neutral-200 shrink-0 border border-[#e0e0e0]">
                <img
                  src={property.featuredPhoto || (property.photos && property.photos[0]) || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400"}
                  alt={property.title}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-none bg-[#282828] text-white uppercase">
                  {property.suburb} • {isSale ? "FOR SALE" : "FOR RENT"}
                </span>
                <h4 className="font-heading font-bold text-sm text-[#282828] uppercase mt-1">{property.title}</h4>
                <div className="font-mono text-xs font-bold text-[#fa3600]">
                  {formatCurrency(price || 0, property.currency || "ZMW")}
                  {!isSale && <span className="text-[10px] text-[#6b6b6b] font-normal"> / month</span>}
                </div>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="text-[9px] font-mono text-[#6b6b6b] uppercase">Assigned Closing Agent</div>
              <div className="font-heading font-bold text-[#282828] uppercase">
                {property.assignedAgent?.name || property.assignedAgentName || "Unassigned"}
              </div>
            </div>
          </div>

          {/* 2. List of Matching Buyers with Reminder Status & Manual Offer Action */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-sm text-ink-900 flex items-center gap-2">
              <span>Matching Buyers & Automated Delivery Status</span>
            </h4>

            {matches.length === 0 ? (
              <div className="p-8 text-center bg-paper-100 rounded-2xl border border-paper-200 text-ink-600 text-xs">
                No active buyer alerts currently match these criteria in {property.suburb}.
              </div>
            ) : (
              matches.map((match, idx) => {
                const isDelivered = deliveredStatus[match.id] || false;
                const cleanPhone = match.alert.clientPhone.replace(/[^0-9]/g, "");

                return (
                  <div
                    key={match.id || idx}
                    className="p-5 rounded-2xl bg-white border border-border shadow-card space-y-4 hover:border-contour-red/40 transition-all"
                  >
                    {/* Buyer Header & Automated Reminder Pill */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-paper-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-ink-900">{match.alert.clientName}</h5>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            100% Match
                          </span>
                        </div>
                        <div className="text-xs text-ink-600 mt-0.5">
                          Target Budget: <strong className="text-ink-900 font-mono">{match.alert.currency} {match.alert.maxPrice.toLocaleString()}</strong> • Suburb: <strong>{match.alert.suburb}</strong>
                        </div>
                      </div>

                      {/* Automated Reminder Status Badge with Exact Timestamp */}
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Auto-Alert Sent ({match.dispatchTimestamp})</span>
                      </div>
                    </div>

                    {/* Pre-formatted Custom Offer Pitch */}
                    <div className="p-3 rounded-xl bg-paper-100 border border-paper-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-ink-600 uppercase tracking-wider">
                        <span>Personalized Broker Offer Text:</span>
                        <button
                          onClick={() => handleCopyOffer(idx, match.customOfferText)}
                          className="hover:text-ink-900 text-contour-red flex items-center gap-1 transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Pitch</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-ink-800 whitespace-pre-line font-sans text-xs italic">
                        "{match.customOfferText}"
                      </p>
                    </div>

                    {/* Manual Reach-Out Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Option 1: WhatsApp Web Link */}
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(match.customOfferText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-none bg-white hover:bg-[#fff5f3] border border-[#e0e0e0] text-[#282828] text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#fa3600]" />
                        <span>WhatsApp Link</span>
                      </a>

                      {/* Option 2: WhatsApp Image Flyer */}
                      <button
                        type="button"
                        onClick={() => {
                          const flyerText = `🏡 *${property.title}* (${isSale ? "For Sale" : "For Lease"} in ${property.suburb})\n💰 *Price:* ${formatCurrency(price || 0, property.currency || "ZMW")}\n📍 *Location:* ${property.suburb}, Lusaka\n\nHi ${match.alert.clientName}, I am attaching our high-resolution marketing flyer for this newly listed property matching your criteria!`;
                          navigator.clipboard.writeText(flyerText);
                          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(flyerText)}`, "_blank");
                        }}
                        className="py-2 px-3 rounded-none bg-[#fa3600] hover:bg-[#d92f00] text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Image Flyer</span>
                      </button>

                      {/* Phone Call */}
                      <a
                        href={`tel:${match.alert.clientPhone}`}
                        className="py-2 px-3 rounded-none bg-white hover:bg-[#fff5f3] border border-[#e0e0e0] text-[#282828] text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-[#282828]" />
                        <span>Call</span>
                      </a>

                      {/* Mark Delivered Toggle */}
                      <button
                        onClick={() => toggleDelivered(match.id)}
                        className={`py-2 px-3 rounded-none border text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                          isDelivered
                            ? "bg-[#282828] text-white border-[#282828]"
                            : "bg-white border-[#e0e0e0] text-[#282828] hover:bg-neutral-50"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#fa3600]" />
                        <span>{isDelivered ? "Offer Confirmed" : "Mark Contacted"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-[#e0e0e0] flex items-center justify-between shrink-0">
          <Link
            href="/dashboard/pipeline"
            onClick={onClose}
            className="text-xs font-heading font-semibold uppercase tracking-wider text-[#fa3600] hover:underline flex items-center gap-1"
          >
            <span>View All Deals in Pipeline Kanban</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-none bg-[#282828] hover:bg-black text-white text-xs font-heading font-semibold uppercase tracking-wider"
          >
            Done &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
