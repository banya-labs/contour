"use client";

import React from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, ArrowRight, ShieldCheck, PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export type CommissionBreakdownProps = {
  grossVolumeZmw: number;
  grossVolumeUsd: number;
  earnedCommissionZmw: number;
  earnedCommissionUsd: number;
  agentSplitsZmw: number;
  agentSplitsUsd: number;
  pendingPipelineZmw: number;
};

export default function CommissionBreakdownWidget({
  grossVolumeZmw = 4200000,
  grossVolumeUsd = 2050000,
  earnedCommissionZmw = 210000,
  earnedCommissionUsd = 102500,
  agentSplitsZmw = 105000,
  agentSplitsUsd = 51250,
  pendingPipelineZmw = 388500,
}: Partial<CommissionBreakdownProps>) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-4 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-contour-emerald text-white flex items-center justify-center font-bold shadow-subtle">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs text-ink-900">
              Agency Revenue & Commission Breakdown
            </h4>
            <p className="text-[10px] text-ink-600">
              5% Brokerage Fee vs 50% Closing Agent Splits
            </p>
          </div>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          Reconciled
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded-xl bg-paper-100 border border-paper-200">
          <div className="text-[10px] font-semibold text-ink-600 uppercase tracking-wider">
            Earned 5% Fee (USD)
          </div>
          <div className="font-mono text-sm font-bold text-ink-900 mt-0.5">
            $ {earnedCommissionUsd.toLocaleString()}
          </div>
          <div className="text-[9px] text-ink-500 mt-0.5">
            Net Agency: $ {(earnedCommissionUsd - agentSplitsUsd).toLocaleString()}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-paper-100 border border-paper-200">
          <div className="text-[10px] font-semibold text-ink-600 uppercase tracking-wider">
            Earned 5% Fee (ZMW)
          </div>
          <div className="font-mono text-sm font-bold text-ink-900 mt-0.5">
            K {earnedCommissionZmw.toLocaleString()}
          </div>
          <div className="text-[9px] text-ink-500 mt-0.5">
            Net Agency: K {(earnedCommissionZmw - agentSplitsZmw).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Pipeline Forecast Pill */}
      <div className="p-2.5 rounded-xl bg-paper-200/60 border border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-contour-red" />
          <span className="text-[11px] font-medium text-ink-800">Expected Pipeline 5% Fee</span>
        </div>
        <span className="font-mono font-bold text-contour-red">
          K {pendingPipelineZmw.toLocaleString()}
        </span>
      </div>

      {/* CTA to Ledger */}
      <Link
        href="/dashboard/commissions"
        className="w-full py-2 px-3 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-center text-xs font-semibold shadow-subtle flex items-center justify-center gap-1 transition-transform active:scale-95"
      >
        <span>Open Commissions Ledger</span>
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
