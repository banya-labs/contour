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
    <div className="w-full">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16382B]/10 border border-[#16382B]/15 text-[#16382B] text-xs font-semibold">
          <Calculator className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span>REVENUE RECOVERY INTELLIGENCE</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#16382B] tracking-tight">
          Calculate Your Recovered Brokerage Revenue
        </h2>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
          See exactly how much uncollected commission, lost agent time, and month-end remittance leakage Contour recovers for your agency every month.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
        
        {/* Controls Form */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E0D4] shadow-sm space-y-6">
          
          {/* Currency Selector */}
          <div className="flex items-center justify-between pb-4 border-b border-[#ECE7DE]">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono">
              Operating Currency
            </span>
            <div className="inline-flex p-1 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4]">
              <button
                type="button"
                onClick={() => setCurrency("ZMW")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currency === "ZMW"
                    ? "bg-[#16382B] text-white shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                ZMW (Kwacha)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currency === "USD"
                    ? "bg-[#16382B] text-white shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>

          {/* Monthly Listings / Deals Handled */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="monthly-listings" className="font-semibold text-stone-800">
                Monthly Active Listings & Mandates
              </label>
              <span className="font-mono font-bold text-sm text-[#16382B] bg-[#FAF8F5] border border-[#E6E0D4] px-2.5 py-0.5 rounded-md">
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
              className="w-full h-2 bg-[#FAF8F5] rounded-lg appearance-none cursor-pointer accent-[#16382B]"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>1 mandate</span>
              <span>25 mandates</span>
              <span>50 mandates</span>
            </div>
          </div>

          {/* Average Property Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="avg-price" className="font-semibold text-stone-800">
                Average Property Transaction Value ({currency})
              </label>
              <span className="font-mono font-bold text-sm text-[#16382B] bg-[#FAF8F5] border border-[#E6E0D4] px-2.5 py-0.5 rounded-md">
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
                className="w-full h-2 bg-[#FAF8F5] rounded-lg appearance-none cursor-pointer accent-[#16382B]"
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
                className="w-full h-2 bg-[#FAF8F5] rounded-lg appearance-none cursor-pointer accent-[#16382B]"
              />
            )}
            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>{currency === "ZMW" ? "K 500k" : "$ 25k"}</span>
              <span>{currency === "ZMW" ? "K 7.5M" : "$ 500k"}</span>
              <span>{currency === "ZMW" ? "K 15M" : "$ 1M"}</span>
            </div>
          </div>

          {/* Commission Rate & Leak Rate Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="comm-rate" className="font-semibold text-stone-800">
                  Agency Commission
                </label>
                <span className="font-mono font-bold text-[#16382B]">{commissionRate}%</span>
              </div>
              <input
                id="comm-rate"
                type="range"
                min="3"
                max="7"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 5)}
                className="w-full h-2 bg-[#FAF8F5] rounded-lg appearance-none cursor-pointer accent-[#16382B]"
              />
              <span className="text-[10px] text-stone-500 block">Regional standard is 5%</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="leak-rate" className="font-semibold text-stone-800">
                  Estimated Leakage
                </label>
                <span className="font-mono font-bold text-amber-700">{leakRate}%</span>
              </div>
              <input
                id="leak-rate"
                type="range"
                min="5"
                max="30"
                step="1"
                value={leakRate}
                onChange={(e) => setLeakRate(parseInt(e.target.value) || 15)}
                className="w-full h-2 bg-[#FAF8F5] rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-[10px] text-stone-500 block">WhatsApp & Excel leakage</span>
            </div>
          </div>
        </div>

        {/* Results Board */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Top Recovered Revenue Banner */}
          <div className="bg-[#16382B] text-white rounded-3xl p-6 sm:p-7 border border-[#C89B3C]/30 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-[#E8C265] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#E8C265]">
                    Annual Recovered Revenue
                  </span>
                  <p className="text-xs text-stone-300">Net commission retained by brokerage</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#E8C265] text-[#16382B] text-[11px] font-bold">
                {calculations.roiMultiplier}x ROI
              </span>
            </div>

            <div className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#E8C265] font-mono tracking-tight">
              {formatCurrency(calculations.annualRecoveredRevenue, currency)}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-white/10 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-mono">Monthly Cashflow Gain</span>
                <span className="font-bold text-white font-mono text-sm sm:text-base">
                  +{formatCurrency(calculations.monthlyRecoveredCashflow, currency)}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-mono">Agent Time Saved</span>
                <span className="font-bold text-white font-mono text-sm sm:text-base">
                  ~{calculations.hoursSavedPerMonth} hrs / month
                </span>
              </div>
            </div>
          </div>

          {/* Three Leak Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-white rounded-2xl border border-[#E6E0D4] shadow-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">Leak 1: Mandates</span>
              <p className="font-bold text-[#16382B]">Lost Exclusivity</p>
              <p className="text-[11px] text-stone-500 leading-tight">
                30-day client registration locks out competing rogue brokers.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E6E0D4] shadow-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">Leak 2: Arrears</span>
              <p className="font-bold text-[#16382B]">Delayed Rent</p>
              <p className="text-[11px] text-stone-500 leading-tight">
                Automated WhatsApp nudges with 4-day cooldown recover 94% on time.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E6E0D4] shadow-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">Leak 3: Statements</span>
              <p className="font-bold text-[#16382B]">End-of-Month Toil</p>
              <p className="text-[11px] text-stone-500 leading-tight">
                1-click reconciled landlord remittances via The DocuSign Seam.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
