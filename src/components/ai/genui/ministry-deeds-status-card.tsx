"use client";

import React from "react";
import Link from "next/link";
import { Landmark, FileText, ArrowRight, ShieldCheck, Clock } from "lucide-react";

export type MinistryDeedsProps = {
  propertyTitle: string;
  suburb: string;
  buyerName: string;
  transferStatus: "DEEDS_LODGED" | "TRANSFER_COMPLETE" | "PENDING_STATE_CONSENT";
  ministryReference: string;
};

export default function MinistryDeedsStatusCard({
  propertyTitle = "5-Acre Commercial Development Plot",
  suburb = "Roma Park",
  buyerName = "AfriCorp Logistics Zambia Ltd",
  transferStatus = "DEEDS_LODGED",
  ministryReference = "LUS/LAND/2026/8942-A",
}: Partial<MinistryDeedsProps>) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-paper-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-ink-900 text-white flex items-center justify-center font-bold shadow-subtle">
            <Landmark className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs text-ink-900">Ministry of Lands Registry</h4>
            <p className="text-[10px] text-ink-600">Cadastral & Title Deed Custody</p>
          </div>
        </div>
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
            transferStatus === "TRANSFER_COMPLETE"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {transferStatus.replace(/_/g, " ")}
        </span>
      </div>

      <div className="p-3 rounded-xl bg-paper-100 border border-paper-200 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-ink-600">Property:</span>
          <span className="font-bold text-ink-900 truncate max-w-[170px]">{propertyTitle}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-600">Buyer Entity:</span>
          <span className="font-medium text-ink-900 truncate max-w-[170px]">{buyerName}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-paper-200">
          <span className="text-ink-600 font-semibold">Lands Folio Ref:</span>
          <span className="font-mono font-bold text-ink-900">{ministryReference}</span>
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between">
        <span className="text-[10px] text-ink-500 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-contour-emerald" />
          <span>POPIA Encrypted Custody</span>
        </span>
        <Link
          href="/dashboard/documents"
          className="text-xs font-semibold text-contour-red hover:underline flex items-center gap-1"
        >
          <span>Open Deeds Vault</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
