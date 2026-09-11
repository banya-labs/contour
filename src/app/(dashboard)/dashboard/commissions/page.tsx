"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MotionCard } from "@/components/ui/animate/motion-card";

export default function CommissionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/sales");
        const data = await res.json();
        if (data.success && data.transactions) {
          setTransactions(data.transactions);
        }
      } catch (err) {
        console.error("Failed to load commissions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = React.useMemo(() => {
    const earnedByCurrency: Record<string, number> = {};
    const agentSplitsByCurrency: Record<string, number> = {};
    const netByCurrency: Record<string, number> = {};
    let totalDeals = transactions.length;

    transactions.forEach((tx) => {
      const cur = tx.currency || "ZMW";
      const comm = Number(tx.agencyCommissionAmount || 0);
      const split = Number(tx.agentSplitAmount || 0);

      earnedByCurrency[cur] = (earnedByCurrency[cur] || 0) + comm;
      agentSplitsByCurrency[cur] = (agentSplitsByCurrency[cur] || 0) + split;
      netByCurrency[cur] = (netByCurrency[cur] || 0) + (comm - split);
    });

    const earnedStr =
      Object.entries(earnedByCurrency)
        .map(([cur, val]) => formatCurrency(val, cur))
        .join(" + ") || "K 0";

    const agentSplitsStr =
      Object.entries(agentSplitsByCurrency)
        .map(([cur, val]) => formatCurrency(val, cur))
        .join(" + ") || "K 0";

    const netStr =
      Object.entries(netByCurrency)
        .map(([cur, val]) => formatCurrency(val, cur))
        .join(" + ") || "K 0";

    return {
      earnedStr,
      agentSplitsStr,
      netStr,
      totalDeals,
    };
  }, [transactions]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-4 sm:space-y-6 w-full h-full overflow-y-auto font-geist antialiased text-editorial-black">
      {/* Header */}
      <div className="pb-4 sm:pb-6 border-b border-editorial-border">
        <div className="flex items-center gap-2">
          <span className="text-[9px] sm:text-[10px] font-geist font-bold px-1.5 sm:px-2 py-0.5 border border-editorial-border bg-neutral-100 text-editorial-black uppercase tracking-wider">
            Financial Ledger
          </span>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted">
            5% Statutory Brokerage Model
          </span>
        </div>
        <h1 className="font-heading text-xl sm:text-3xl font-bold text-editorial-black mt-1 uppercase tracking-tight">
          Commission & Deal Splits Ledger
        </h1>
        <p className="text-xs text-editorial-muted mt-1 max-w-3xl">
          Distinguish gross asset conveyance volume from contracted 5% agency commission and 50% field agent payouts.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <MotionCard withCorners className="p-3.5 sm:p-5">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-contour-red uppercase tracking-wider">
            Total 5% Agency Commission
          </span>
          <div className="font-geist text-xl sm:text-2xl font-bold text-contour-red mt-1 tracking-tight truncate">
            {loading ? "…" : stats.earnedStr}
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            Retained across {stats.totalDeals} transactions
          </span>
        </MotionCard>

        <MotionCard withCorners className="p-3.5 sm:p-5">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-editorial-black uppercase tracking-wider">
            Agent Split Payouts (50%)
          </span>
          <div className="font-geist text-xl sm:text-2xl font-bold text-editorial-black mt-1 tracking-tight truncate">
            {loading ? "…" : stats.agentSplitsStr}
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            Payable to closing field agents
          </span>
        </MotionCard>

        <MotionCard withCorners className="p-3.5 sm:p-5">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-editorial-black uppercase tracking-wider">
            Net Retained Cashflow
          </span>
          <div className="font-geist text-xl sm:text-2xl font-bold text-emerald-800 mt-1 tracking-tight truncate">
            {loading ? "…" : stats.netStr}
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            Net operating agency margin
          </span>
        </MotionCard>
      </div>

      {/* Transactions Ledger Table Card */}
      <div className="bg-white border border-editorial-border">
        <div className="p-3 sm:p-4 border-b border-editorial-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-xs sm:text-sm text-editorial-black uppercase tracking-wider">
            Conveyance & Commission Pipeline
          </h3>
          <span className="text-[9px] sm:text-[10px] font-geist text-editorial-muted uppercase tracking-wider">
            Lenco / Paystack Reconciled
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-editorial-muted text-xs font-geist">
            Loading commissions ledger from database...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-xs text-editorial-muted font-geist">
            No closed sale commissions recorded yet.
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-editorial-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 space-y-2 bg-white text-xs font-geist">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-heading font-bold text-sm text-editorial-black truncate">
                      {tx.property?.title || "Untitled Property"}
                    </h4>
                    <span
                      className={`inline-block text-[9px] uppercase tracking-wider px-2 py-0.2 border shrink-0 ${
                        tx.status === "RECEIVED"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                          : "border-amber-300 bg-amber-50 text-amber-800 font-semibold"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-neutral-50 border border-editorial-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-editorial-muted">Asset Value:</span>
                      <strong className="text-editorial-black">{formatCurrency(Number(tx.grossValue), tx.currency)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-editorial-muted">5% Agency Fee:</span>
                      <strong className="text-contour-red">{formatCurrency(Number(tx.agencyCommissionAmount), tx.currency)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-editorial-muted">Agent Split (50%):</span>
                      <strong className="text-editorial-black">{formatCurrency(Number(tx.agentSplitAmount), tx.currency)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-editorial-muted">Closing Agent:</span>
                      <span>{tx.closingAgent?.name || "Unassigned"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-geist">
                <thead className="bg-neutral-50 text-editorial-muted uppercase tracking-wider text-[10px] font-heading font-semibold border-b border-editorial-border">
                  <tr>
                    <th className="py-3 px-4">Property Deal</th>
                    <th className="py-3 px-4">Gross Asset Value</th>
                    <th className="py-3 px-4">5% Agency Fee</th>
                    <th className="py-3 px-4">Agent Share (50%)</th>
                    <th className="py-3 px-4">Closing Agent</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-editorial-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#fff5f3]/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-editorial-black max-w-xs">
                      {tx.property?.title || "Untitled Property"}
                    </td>
                    <td className="py-3.5 px-4 font-geist text-editorial-muted">
                      {formatCurrency(Number(tx.grossValue), tx.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-geist font-bold text-contour-red">
                      {formatCurrency(Number(tx.agencyCommissionAmount), tx.currency)} ({Number(tx.agencyCommissionPct)}%)
                    </td>
                    <td className="py-3.5 px-4 font-geist font-bold text-editorial-black">
                      {formatCurrency(Number(tx.agentSplitAmount), tx.currency)} ({Number(tx.agentSplitPct)}%)
                    </td>
                    <td className="py-3.5 px-4 text-editorial-black font-medium">
                      {tx.closingAgent?.name || "Unassigned"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[9px] font-geist uppercase tracking-wider px-2 py-0.2 border ${
                          tx.status === "RECEIVED"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : tx.status === "EXPECTED"
                            ? "border-amber-300 bg-amber-50 text-amber-800"
                            : "border-red-300 bg-red-50 text-red-800"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
