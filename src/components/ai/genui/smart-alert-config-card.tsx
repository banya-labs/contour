"use client";

import React, { useState } from "react";
import { Bell, CheckCircle2, Sparkles, Send } from "lucide-react";
import { registerPropertyAlert } from "@/lib/alerts/matchmaker";

export default function SmartAlertConfigCard({
  suburb = "Leopards Hill",
  listingType = "FOR_RENT",
  maxPrice = 2500,
  currency = "USD",
  clientName = "Registered Client",
}: {
  suburb?: string;
  listingType?: string;
  maxPrice?: number;
  currency?: string;
  clientName?: string;
}) {
  const [phone, setPhone] = useState("+260 97 123 4567");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Register active alert in the reverse matching engine
    registerPropertyAlert({
      organizationId: "org_contour_demo",
      clientName: clientName || "Registered Buyer",
      clientPhone: phone,
      suburb,
      listingType: listingType as "FOR_SALE" | "FOR_RENT",
      maxPrice,
      currency: currency as "ZMW" | "USD",
      minBedrooms: 3,
      assignedAgentName: "Tembo Mwape",
      status: "ACTIVE",
    });

    setSaved(true);
    alert(`[SMART ALERT REGISTERED & ACTIVE]\nSubscribed: ${phone}\nCriteria: New ${listingType} in ${suburb} under ${currency} ${maxPrice}\nChannel: Automated WhatsApp dispatch the moment a matching property is added!`);
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-paper-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-contour-red text-white flex items-center justify-center font-bold shadow-subtle">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs text-ink-900">Smart Property Alert Builder</h4>
            <p className="text-[10px] text-ink-600">Instant WhatsApp Criteria Trigger</p>
          </div>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-paper-200 text-ink-800">
          AI Auto-Nudge
        </span>
      </div>

      <div className="p-3 rounded-xl bg-paper-100 border border-paper-200 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-ink-600">Target Suburb:</span>
          <span className="font-bold text-ink-900">{suburb}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-600">Max Budget:</span>
          <span className="font-mono font-bold text-contour-red">
            {currency} {maxPrice.toLocaleString()} / mo
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-600">Notification Channel:</span>
          <span className="font-medium text-emerald-700">WhatsApp Dispatch (Reverse Match)</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-2 text-xs">
        <div>
          <label className="block text-[10px] font-semibold text-ink-700 mb-1">
            Agent / Buyer WhatsApp Number for Alerts:
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-paper-100 px-3 py-1.5 rounded-xl border border-border text-xs text-ink-900 focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saved}
          className={`w-full py-2 px-3 rounded-full font-semibold shadow-subtle flex items-center justify-center gap-1.5 transition-all ${
            saved
              ? "bg-emerald-600 text-white cursor-default"
              : "bg-ink-900 hover:bg-ink-950 text-white active:scale-95"
          }`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Smart Alert Activated & Monitoring!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-contour-red" />
              <span>Activate WhatsApp Criteria Alert</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
