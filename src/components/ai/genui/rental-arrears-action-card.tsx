"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, MessageSquare, CheckCircle2, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export type RentalArrearsProps = {
  tenantName: string;
  propertyTitle: string;
  arrearsAmount: number;
  currency: string;
  daysOverdue: number;
  tenantPhone: string;
};

export default function RentalArrearsActionCard({
  tenantName = "Sarah Lungu",
  propertyTitle = "Luxury 2-Bedroom Serviced Apartment (Woodlands)",
  arrearsAmount = 18000,
  currency = "ZMW",
  daysOverdue = 14,
  tenantPhone = "+260966445566",
}: Partial<RentalArrearsProps>) {
  const [nudged, setNudged] = useState(false);

  const handleNudge = () => {
    setNudged(true);
    alert(`[WHATSAPP ARREARS NUDGE SENT]\nTo: ${tenantName} (${tenantPhone})\nMessage: Friendly reminder regarding K 18,000 overdue rent for Woodlands apartment. 4-day cooldown key active.`);
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-paper-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-subtle">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs text-ink-900">Rental Arrears Alert</h4>
            <p className="text-[10px] text-ink-600">Automated WhatsApp Follow-up Ready</p>
          </div>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
          {daysOverdue} Days Overdue
        </span>
      </div>

      <div className="p-3 rounded-xl bg-paper-100 border border-paper-200 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-ink-600">Tenant:</span>
          <span className="font-bold text-ink-900">{tenantName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-600">Property:</span>
          <span className="font-medium text-ink-900 truncate max-w-[180px]">{propertyTitle}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-paper-200">
          <span className="text-ink-600 font-semibold">Overdue Balance:</span>
          <span className="font-mono font-bold text-contour-red">
            {formatCurrency(arrearsAmount, currency)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleNudge}
          disabled={nudged}
          className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold shadow-subtle flex items-center justify-center gap-1.5 transition-all ${
            nudged
              ? "bg-emerald-600 text-white cursor-default"
              : "bg-contour-amber hover:bg-contour-amber/90 text-white active:scale-95"
          }`}
        >
          {nudged ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Nudge Sent (4-Day Lock)</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Dispatch WhatsApp Reminder</span>
            </>
          )}
        </button>

        <Link
          href="/dashboard/leases"
          className="p-2 rounded-full border border-border hover:bg-paper-200 text-ink-800 transition-colors"
          title="View Lease Ledger"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
