"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, TrendingUp, CheckCircle2, Clock, UserCheck, Bot } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

  // Compute stats dynamically
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

    const earnedStr = Object.entries(earnedByCurrency)
      .map(([cur, val]) => formatCurrency(val, cur))
      .join(" + ") || "K 0";

    const agentSplitsStr = Object.entries(agentSplitsByCurrency)
      .map(([cur, val]) => formatCurrency(val, cur))
      .join(" + ") || "K 0";

    const netStr = Object.entries(netByCurrency)
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
    <div className="p-6 sm:p-8 pb-32 sm:pb-40 space-y-6 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-contour-red uppercase tracking-wider">
          Revenue Intelligence
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-0.5">
          Commission & Deal Splits
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Distinguish gross asset value from true 5% agency revenue and 50% agent payouts.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
          <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">
            Total Earned Agency Commission
          </span>
          <div className="font-mono text-2xl font-bold text-contour-red mt-1">
            {loading ? "…" : stats.earnedStr}
          </div>
          <span className="text-[11px] text-ink-600 mt-0.5 block">From {stats.totalDeals} deal{stats.totalDeals === 1 ? "" : "s"} in pipeline</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
          <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">
            Agent Split Payouts (50%)
          </span>
          <div className="font-mono text-2xl font-bold text-ink-900 mt-1">
            {loading ? "…" : stats.agentSplitsStr}
          </div>
          <span className="text-[11px] text-ink-600 mt-0.5 block">Payable to closing field agents</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
          <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">
            Net Agency Retained Profit
          </span>
          <div className="font-mono text-2xl font-bold text-contour-emerald mt-1">
            {loading ? "…" : stats.netStr}
          </div>
          <span className="text-[11px] text-ink-600 mt-0.5 block">Retained brokerage cash flow</span>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-sm text-ink-900">Deals & Commission Pipeline</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-ink-600 font-medium">
            <Bot className="animate-spin w-8 h-8 mb-2 text-contour-red" />
            <span>Loading commissions ledger from database...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-white">
            <DollarSign className="w-12 h-12 text-ink-400" />
            <h3 className="font-semibold text-ink-900">No transactions recorded</h3>
            <p className="text-sm text-ink-600 max-w-sm">No commissions have been registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper-100 text-ink-600 uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="p-4 font-semibold">Property Deal</th>
                  <th className="p-4 font-semibold">Gross Value</th>
                  <th className="p-4 font-semibold">Agency Fee</th>
                  <th className="p-4 font-semibold">Agent Split</th>
                  <th className="p-4 font-semibold">Closing Agent</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-paper-100/50 transition-colors">
                    <td className="p-4 font-medium text-ink-900 max-w-xs">{tx.property?.title || "Untitled Property"}</td>
                    <td className="p-4 font-mono text-ink-600">{formatCurrency(Number(tx.grossValue), tx.currency)}</td>
                    <td className="p-4 font-mono font-bold text-contour-red">
                      {formatCurrency(Number(tx.agencyCommissionAmount), tx.currency)} ({Number(tx.agencyCommissionPct)}%)
                    </td>
                    <td className="p-4 font-mono font-bold text-ink-900">
                      {formatCurrency(Number(tx.agentSplitAmount), tx.currency)} ({Number(tx.agentSplitPct)}%)
                    </td>
                    <td className="p-4 text-ink-800 font-medium">{tx.closingAgent?.name || "Unassigned"}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          tx.status === "RECEIVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : tx.status === "EXPECTED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
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
        )}
      </div>
    </div>
  );
}
