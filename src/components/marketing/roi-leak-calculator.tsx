"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Calculator,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function RoiLeakCalculator() {
  const [currency, setCurrency] = useState<"ZMW" | "USD">("ZMW");
  const [monthlyListings, setMonthlyListings] = useState<number>(20);
  const [avgPriceZmw, setAvgPriceZmw] = useState<number>(2500000);
  const [avgPriceUsd, setAvgPriceUsd] = useState<number>(100000);
  const [commissionRate, setCommissionRate] = useState<number>(5);
  const [leakRate, setLeakRate] = useState<number>(15);

  const avgPrice = currency === "ZMW" ? avgPriceZmw : avgPriceUsd;

  // Calculation Engine
  const calculations = useMemo(() => {
    const annualGrossVolume = monthlyListings * avgPrice * 12;
    const annualCommissionPool = annualGrossVolume * (commissionRate / 100);
    const annualLeakedCommission = annualCommissionPool * (leakRate / 100);
    const annualRecoveredRevenue = annualLeakedCommission * 0.85; // 85% plug rate
    const monthlyRecoveredCashflow = annualRecoveredRevenue / 12;
    const hoursSavedPerMonth = Math.round(monthlyListings * 1.5);

    const annualContourCost = currency === "USD" ? 129 * 12 : 3200 * 12;
    const roiMultiplier = Math.max(1, Math.round(annualRecoveredRevenue / annualContourCost));

    return {
      annualGrossVolume,
      annualCommissionPool,
      annualLeakedCommission,
      annualRecoveredRevenue,
      monthlyRecoveredCashflow,
      hoursSavedPerMonth,
      roiMultiplier,
    };
  }, [monthlyListings, avgPrice, commissionRate, leakRate, currency]);

  return (
    <section className="py-20 bg-paper-200/60 border-y border-border" id="calculator">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-300 border border-border text-ink-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Calculator className="w-3.5 h-3.5 text-contour-red" />
            Revenue Intelligence Engine
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            Calculate Your Recovered Brokerage Revenue
          </h2>
          <p className="text-sm sm:text-base text-ink-600 mt-3 leading-relaxed">
            See exactly how much uncollected commission, lost agent time, and month-end remittance leakage Contour recovers for your agency every month.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-6">
            {/* Currency Selector */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-700">
                Operating Currency
              </span>
              <div className="inline-flex p-1 rounded-xl bg-paper-200 border border-border">
                <button
                  type="button"
                  onClick={() => setCurrency("ZMW")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currency === "ZMW"
                      ? "bg-contour-dark text-white shadow-subtle"
                      : "text-ink-700 hover:text-ink-950"
                  }`}
                >
                  ZMW (K)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currency === "USD"
                      ? "bg-contour-dark text-white shadow-subtle"
                      : "text-ink-700 hover:text-ink-950"
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {/* Monthly Listings / Deals Handled */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="monthly-listings" className="font-semibold text-ink-800">
                  Monthly Active Listings & Mandates
                </label>
                <span className="font-mono font-bold text-sm text-contour-dark bg-paper-200 px-2 py-0.5 rounded">
                  {monthlyListings} mandates
                </span>
              </div>
              <input
                id="monthly-listings"
                type="range"
                min="1"
                max="50"
                step="1"
                value={monthlyListings}
                onChange={(e) => setMonthlyListings(parseInt(e.target.value) || 1)}
                className="w-full h-2 bg-paper-300 rounded-lg appearance-none cursor-pointer accent-contour-red"
              />
              <div className="flex justify-between text-[10px] text-ink-400 font-mono">
                <span>1 mandate</span>
                <span>25 mandates</span>
                <span>50 mandates</span>
              </div>
            </div>

            {/* Average Property Price */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="avg-price" className="font-semibold text-ink-800">
                  Average Property Transaction Value ({currency})
                </label>
                <span className="font-mono font-bold text-sm text-contour-dark bg-paper-200 px-2 py-0.5 rounded">
                  {formatCurrency(avgPrice, currency)}
                </span>
              </div>
              {currency === "ZMW" ? (
                <input
                  id="avg-price"
                  type="range"
                  min="500000"
                  max="15000000"
                  step="250000"
                  value={avgPriceZmw}
                  onChange={(e) => setAvgPriceZmw(parseInt(e.target.value) || 500000)}
                  className="w-full h-2 bg-paper-300 rounded-lg appearance-none cursor-pointer accent-contour-red"
                />
              ) : (
                <input
                  id="avg-price"
                  type="range"
                  min="25000"
                  max="1000000"
                  step="25000"
                  value={avgPriceUsd}
                  onChange={(e) => setAvgPriceUsd(parseInt(e.target.value) || 25000)}
                  className="w-full h-2 bg-paper-300 rounded-lg appearance-none cursor-pointer accent-contour-red"
                />
              )}
              <div className="flex justify-between text-[10px] text-ink-400 font-mono">
                <span>{currency === "ZMW" ? "K 500k" : "$ 25k"}</span>
                <span>{currency === "ZMW" ? "K 7.5M" : "$ 500k"}</span>
                <span>{currency === "ZMW" ? "K 15M" : "$ 1M"}</span>
              </div>
            </div>

            {/* Commission Rate & Leak Rate Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="comm-rate" className="font-semibold text-ink-800">
                    Agency Commission
                  </label>
                  <span className="font-mono font-bold text-contour-red">{commissionRate}%</span>
                </div>
                <input
                  id="comm-rate"
                  type="range"
                  min="3"
                  max="7"
                  step="0.5"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 5)}
                  className="w-full h-2 bg-paper-300 rounded-lg appearance-none cursor-pointer accent-contour-red"
                />
                <span className="text-[10px] text-ink-600 block">Regional standard is 5%</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="leak-rate" className="font-semibold text-ink-800">
                    Estimated Leakage
                  </label>
                  <span className="font-mono font-bold text-contour-amber">{leakRate}%</span>
                </div>
                <input
                  id="leak-rate"
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={leakRate}
                  onChange={(e) => setLeakRate(parseInt(e.target.value) || 15)}
                  className="w-full h-2 bg-paper-300 rounded-lg appearance-none cursor-pointer accent-contour-amber"
                />
                <span className="text-[10px] text-ink-600 block">WhatsApp & Excel leakage</span>
              </div>
            </div>
          </div>

          {/* Results Board */}
          <div className="lg:col-span-6 space-y-4">
            {/* Top Recovered Revenue Banner */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-contour-emerald/40 shadow-floating relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-contour-emerald/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-contour-emerald/10 text-contour-emerald flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                    Annual Recovered Revenue
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-contour-emerald/10 text-contour-emerald text-[11px] font-bold">
                  +{calculations.roiMultiplier}x Net ROI
                </span>
              </div>

              <div className="font-mono text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
                {formatCurrency(calculations.annualRecoveredRevenue, currency)}
                <span className="text-sm font-sans font-normal text-ink-600"> / year</span>
              </div>
              <p className="text-xs text-ink-600 mt-2 leading-relaxed">
                Estimated net cashflow added directly to your agency retainage pool by plugging uncollected fees and deal drops.
              </p>
            </div>

            {/* 3 Metric Sub-Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Leaked Cashflow */}
              <div className="bg-white rounded-xl p-4 border border-border shadow-card">
                <div className="flex items-center gap-1.5 text-contour-red text-xs font-semibold mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Annual Leakage</span>
                </div>
                <div className="font-mono text-lg font-bold text-ink-900">
                  {formatCurrency(calculations.annualLeakedCommission, currency)}
                </div>
                <span className="text-[10px] text-ink-400 block mt-1">Without Contour</span>
              </div>

              {/* Monthly Cashflow */}
              <div className="bg-white rounded-xl p-4 border border-border shadow-card">
                <div className="flex items-center gap-1.5 text-contour-emerald text-xs font-semibold mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Monthly Boost</span>
                </div>
                <div className="font-mono text-lg font-bold text-ink-900">
                  {formatCurrency(calculations.monthlyRecoveredCashflow, currency)}
                </div>
                <span className="text-[10px] text-ink-400 block mt-1">Retained cashflow</span>
              </div>

              {/* Hours Saved */}
              <div className="bg-white rounded-xl p-4 border border-border shadow-card">
                <div className="flex items-center gap-1.5 text-contour-amber text-xs font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Admin Saved</span>
                </div>
                <div className="font-mono text-lg font-bold text-ink-900">
                  {calculations.hoursSavedPerMonth} hrs
                </div>
                <span className="text-[10px] text-ink-400 block mt-1">On statements / mo</span>
              </div>
            </div>

            {/* Bottom Action Card */}
            <div className="bg-paper-100 rounded-xl p-4 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <div className="text-xs font-bold text-ink-900 flex items-center gap-1.5 justify-center sm:justify-start">
                  <CheckCircle2 className="w-3.5 h-3.5 text-contour-emerald" />
                  <span>Zero Risk Guarantee</span>
                </div>
                <span className="text-[11px] text-ink-600">
                  Setup in 15 minutes. Import listings from Excel or WhatsApp.
                </span>
              </div>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-contour-dark hover:bg-ink-950 text-white text-xs font-semibold transition-all shadow-subtle flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Stop Leaking Revenue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
