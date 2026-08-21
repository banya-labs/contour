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
    <div className="fixed inset-0 z-[2200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden w-full max-w-3xl max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-paper-100 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-contour-red text-white flex items-center justify-center font-bold shadow-subtle">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-ink-900">
                  Reverse-Match Engine Triggered
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {matches.length} Matching Buyer{matches.length !== 1 ? "s" : ""} Found
                </span>
              </div>
              <p className="text-[11px] text-ink-600">
                Automated WhatsApp alerts dispatched. You can also reach out manually with customized offers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-600 hover:bg-paper-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Newly Added Property Card Banner */}
          <div className="p-4 rounded-2xl bg-paper-100 border border-paper-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-paper-300 shrink-0 border border-paper-200">
                <img
                  src={property.featuredPhoto || (property.photos && property.photos[0]) || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400"}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-ink-900 text-white">
                  {property.suburb} • {isSale ? "FOR SALE" : "FOR RENT"}
                </span>
                <h4 className="font-bold text-sm text-ink-900 mt-1">{property.title}</h4>
                <div className="font-mono text-xs font-bold text-contour-red">
                  {formatCurrency(price || 0, property.currency || "ZMW")}
                  {!isSale && <span className="text-[10px] text-ink-600 font-normal"> / month</span>}
                </div>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="text-[10px] text-ink-500">Assigned Closing Agent</div>
              <div className="font-bold text-ink-900">{property.assignedAgentName || "Tembo Mwape"}</div>
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
                        className="py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <span className="text-sm">🔗</span>
                        <span>WhatsApp Web Link</span>
                      </a>

                      {/* Option 2: WhatsApp Image Flyer */}
                      <button
                        type="button"
                        onClick={() => {
                          const flyerText = `🏡 *${property.title}* (${isSale ? "For Sale" : "For Lease"} in ${property.suburb})\n💰 *Price:* ${formatCurrency(price || 0, property.currency || "ZMW")}\n📍 *Location:* ${property.suburb}, Lusaka\n\nHi ${match.alert.clientName}, I am attaching our high-resolution marketing flyer for this newly listed property matching your criteria!`;
                          navigator.clipboard.writeText(flyerText);
                          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(flyerText)}`, "_blank");
                        }}
                        className="py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-subtle flex items-center gap-1.5 transition-transform active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Image Flyer</span>
                      </button>

                      {/* Phone Call */}
                      <a
                        href={`tel:${match.alert.clientPhone}`}
                        className="py-2 px-3 rounded-xl bg-paper-100 hover:bg-paper-200 border border-border text-ink-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-contour-emerald" />
                        <span>Call</span>
                      </a>

                      {/* Mark Delivered Toggle */}
                      <button
                        onClick={() => toggleDelivered(match.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          isDelivered
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white border-border text-ink-700 hover:bg-paper-100"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
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
        <div className="p-4 bg-paper-100 border-t border-border flex items-center justify-between shrink-0">
          <Link
            href="/dashboard/pipeline"
            onClick={onClose}
            className="text-xs font-semibold text-contour-red hover:underline flex items-center gap-1"
          >
            <span>View All Deals in Pipeline Kanban</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-semibold shadow-subtle"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
}
