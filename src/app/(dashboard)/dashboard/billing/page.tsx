"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  Building2,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Download,
  AlertCircle,
  RefreshCw,
  Clock,
  Receipt,
  Layers,
  Check,
} from "lucide-react";
import {
  CONTOUR_PLANS,
  BillingCycle,
  SupportedCurrency,
  getPlanPrice,
  MobileMoneyOperator,
  PaymentChannel,
} from "@/lib/lenco";

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<"starter" | "growth" | "enterprise">("growth");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [currency, setCurrency] = useState<SupportedCurrency>("ZMW");
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>("mobile_money");
  const [momoOperator, setMomoOperator] = useState<MobileMoneyOperator>("mtn");
  const [phone, setPhone] = useState("+260971234567");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mock past invoices
  const [invoices, setInvoices] = useState([
    {
      id: "INV-2026-08-01",
      date: "01 Aug 2026",
      amount: "K 3,200",
      plan: "Growth Agency Plan",
      status: "PAID",
      gateway: "Lenco Zambia",
      receiptUrl: "#",
    },
    {
      id: "INV-2026-07-01",
      date: "01 Jul 2026",
      amount: "K 3,200",
      plan: "Growth Agency Plan",
      status: "PAID",
      gateway: "Lenco Zambia",
      receiptUrl: "#",
    },
    {
      id: "INV-2026-06-01",
      date: "01 Jun 2026",
      amount: "K 3,200",
      plan: "Growth Agency Plan",
      status: "PAID",
      gateway: "Lenco Zambia",
      receiptUrl: "#",
    },
  ]);

  const handleUpgrade = async (planId: "starter" | "growth" | "enterprise") => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingCycle,
          currency,
          channel: paymentChannel,
          mobileMoneyOperator: momoOperator,
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate payment via Lenco.");
      }

      setCurrentPlan(planId);
      const planName = CONTOUR_PLANS[planId].name;
      const price = getPlanPrice(planId, billingCycle, currency).formatted;

      setSuccessMsg(data.message || `Successfully activated ${planName} (${price}/${billingCycle.toLowerCase()})!`);

      // Append new invoice
      const newInv = {
        id: `INV-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 900 + 100)}`,
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        amount: price,
        plan: `${planName} (${billingCycle})`,
        status: "PAID",
        gateway: "Lenco Zambia (ZMW)",
        receiptUrl: "#",
      };
      setInvoices((prev) => [newInv, ...prev]);

      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected billing error occurred.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 7000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-6 sm:space-y-8 w-full h-full overflow-y-auto font-geist">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-editorial-border pb-6">
        <div>
          <span className="text-[11px] font-mono font-bold text-editorial-red uppercase tracking-widest">
            LENCO ZAMBIA COMMERCIAL GATEWAY // BILLING &amp; SEATS
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-editorial-black tracking-tight mt-1">
            Subscription &amp; Payment Gateway
          </h1>
          <p className="text-xs text-editorial-neutral mt-1">
            Manage your agency subscription, active plan seats, Lenco Zambia billing, and historical tax receipts.
          </p>
        </div>

        {/* Currency & Billing Cycle Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Currency Switcher */}
          <div className="inline-flex items-center p-1 bg-white border border-editorial-border text-xs font-mono">
            <button
              onClick={() => setCurrency("ZMW")}
              className={`px-3 py-1.5 transition-colors ${
                currency === "ZMW" ? "bg-editorial-black text-white font-bold" : "text-editorial-neutral hover:text-editorial-black"
              }`}
            >
              ZMW (K)
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1.5 transition-colors ${
                currency === "USD" ? "bg-editorial-black text-white font-bold" : "text-editorial-neutral hover:text-editorial-black"
              }`}
            >
              USD ($)
            </button>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="inline-flex items-center p-1 bg-white border border-editorial-border text-xs font-mono">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-3 py-1.5 transition-colors ${
                billingCycle === "MONTHLY" ? "bg-editorial-black text-white font-bold" : "text-editorial-neutral hover:text-editorial-black"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("ANNUAL")}
              className={`px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
                billingCycle === "ANNUAL" ? "bg-editorial-black text-white font-bold" : "text-editorial-neutral hover:text-editorial-black"
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-editorial-red text-white px-1.5 py-0.2 font-mono font-bold">
                2 Mo Free
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 text-xs font-mono">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 text-editorial-red flex items-center gap-3 text-xs font-mono">
          <AlertCircle className="w-5 h-5 text-editorial-red shrink-0" />
          <span>[BILLING ERROR] {errorMsg}</span>
        </div>
      )}

      {/* Current Active Subscription Status Card */}
      <div className="bg-white border border-editorial-border p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-editorial-black text-white flex items-center justify-center font-serif text-xl font-bold shrink-0">
            {currentPlan === "growth" ? "G" : currentPlan === "starter" ? "S" : "E"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-serif font-bold text-editorial-black">
                {CONTOUR_PLANS[currentPlan].name}
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold tracking-wide">
                ACTIVE STATUS
              </span>
            </div>
            <p className="text-xs text-editorial-neutral mt-0.5 font-mono">
              Settled via <strong className="text-editorial-black">Lenco Zambia</strong> (<a href="https://lenco.co/zm" target="_blank" rel="noreferrer" className="underline text-editorial-red">lenco.co/zm</a>). Next renewal on <span className="font-semibold text-editorial-black">01 October 2026</span>.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-mono text-editorial-neutral">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Max Agents: <strong className="text-editorial-black">{CONTOUR_PLANS[currentPlan].maxAgents}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Listings: <strong className="text-editorial-black">{CONTOUR_PLANS[currentPlan].maxListings}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Managed Units: <strong className="text-editorial-black">{CONTOUR_PLANS[currentPlan].maxRentalUnits}</strong></span>
              </span>
            </div>
          </div>
        </div>

        {/* Accepted Payment Channels */}
        <div className="bg-editorial-paper/40 p-4 border border-editorial-border text-xs space-y-2 shrink-0 font-mono">
          <div className="font-bold text-editorial-black uppercase text-[11px]">Lenco Zambia Payment Rails:</div>
          <div className="flex items-center gap-2 text-editorial-neutral">
            <Smartphone className="w-4 h-4 text-editorial-red" />
            <span>MTN MoMo, Airtel Money &amp; Zamtel Kwacha</span>
          </div>
          <div className="flex items-center gap-2 text-editorial-neutral">
            <CreditCard className="w-4 h-4 text-editorial-black" />
            <span>Visa &amp; Mastercard (ZMW &amp; USD)</span>
          </div>
          <div className="flex items-center gap-2 text-editorial-neutral">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>Direct Bank Transfer &amp; Virtual Accounts</span>
          </div>
        </div>
      </div>

      {/* Payment Channel Selector for Upgrades */}
      <div className="bg-white p-4 border border-editorial-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-editorial-black">
          <span>Preferred Payment Method:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPaymentChannel("mobile_money")}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border transition-colors flex items-center gap-1.5 ${
              paymentChannel === "mobile_money"
                ? "bg-editorial-black text-white border-editorial-black"
                : "bg-white border-editorial-border text-editorial-black hover:bg-editorial-paper"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Money (ZMW)</span>
          </button>

          {paymentChannel === "mobile_money" && (
            <div className="inline-flex items-center gap-1 bg-editorial-paper/40 p-1 border border-editorial-border text-xs">
              {(["mtn", "airtel", "zamtel"] as MobileMoneyOperator[]).map((op) => (
                <button
                  key={op}
                  onClick={() => setMomoOperator(op)}
                  className={`px-2.5 py-1 uppercase text-[10px] font-mono font-bold transition-colors ${
                    momoOperator === op
                      ? "bg-editorial-red text-white"
                      : "text-editorial-neutral hover:text-editorial-black"
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setPaymentChannel("card")}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border transition-colors flex items-center gap-1.5 ${
              paymentChannel === "card"
                ? "bg-editorial-black text-white border-editorial-black"
                : "bg-white border-editorial-border text-editorial-black hover:bg-editorial-paper"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Card (Visa / Mastercard)</span>
          </button>
        </div>
      </div>

      {/* Plan Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(CONTOUR_PLANS).map((plan) => {
          const isSelected = currentPlan === plan.id;
          const priceObj = getPlanPrice(plan.id, billingCycle, currency);

          return (
            <div
              key={plan.id}
              className={`p-6 transition-colors flex flex-col justify-between border ${
                isSelected
                  ? "bg-white border-editorial-black ring-1 ring-editorial-black"
                  : "bg-white border-editorial-border hover:border-editorial-black"
              }`}
            >
              <div className="space-y-4">
                {/* Plan Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-editorial-neutral">
                    {plan.badge}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-mono font-bold bg-editorial-black text-white px-2 py-0.5 uppercase tracking-wider">
                      CURRENT PLAN
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-serif font-bold text-editorial-black">{plan.name}</h3>
                  <p className="text-xs text-editorial-neutral mt-1 min-h-[32px]">{plan.description}</p>
                </div>

                {/* Price Display */}
                <div className="pt-3 border-t border-editorial-border">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-mono font-bold text-editorial-black">
                      {priceObj.formatted}
                    </span>
                    <span className="text-xs font-mono text-editorial-neutral">
                      / {billingCycle === "ANNUAL" ? "yr" : "mo"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-editorial-neutral mt-0.5">
                    {billingCycle === "ANNUAL" ? "Billed annually (includes 2 months free)" : "Billed monthly via Lenco Zambia"}
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-2.5 pt-3 border-t border-editorial-border">
                  <div className="text-xs font-mono font-bold text-editorial-black uppercase tracking-wider">
                    Included Features:
                  </div>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-editorial-black">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-editorial-border">
                {isSelected ? (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 bg-editorial-paper text-editorial-neutral text-xs font-mono font-bold uppercase tracking-wider cursor-not-allowed text-center border border-editorial-border"
                  >
                    Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 bg-editorial-black hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-editorial-red" />
                        <span>Connecting to Lenco...</span>
                      </>
                    ) : (
                      <>
                        <span>Upgrade to {plan.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-editorial-red" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Invoices & Receipts Section */}
      <div className="bg-white border border-editorial-border p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-editorial-border pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-editorial-black">Billing History &amp; Tax Receipts</h2>
            <p className="text-xs text-editorial-neutral mt-0.5">
              Download formal VAT / ZRA receipts for your agency bookkeeping.
            </p>
          </div>
          <Receipt className="w-5 h-5 text-editorial-neutral shrink-0" />
        </div>

        {/* Mobile Cards (md:hidden) */}
        <div className="md:hidden divide-y divide-editorial-border font-mono text-xs">
          {invoices.map((inv) => (
            <div key={inv.id} className="py-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-editorial-black">{inv.id}</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                  {inv.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-editorial-neutral">
                <span>{inv.plan}</span>
                <span className="font-bold text-editorial-black">{inv.amount}</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-editorial-neutral">{inv.date} • {inv.gateway}</span>
                <button
                  onClick={() => alert(`Downloading PDF Receipt for ${inv.id}`)}
                  className="inline-flex items-center gap-1 text-editorial-red hover:underline font-bold"
                >
                  <Download className="w-3 h-3" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-editorial-border text-editorial-neutral font-mono font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">Invoice ID</th>
                <th className="pb-3 px-2">Date</th>
                <th className="pb-3 px-2">Plan Details</th>
                <th className="pb-3 px-2">Amount</th>
                <th className="pb-3 px-2">Gateway</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-editorial-border text-editorial-black font-mono">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-editorial-paper/40 transition-colors">
                  <td className="py-3 px-2 font-bold text-editorial-black">{inv.id}</td>
                  <td className="py-3 px-2 text-editorial-neutral">{inv.date}</td>
                  <td className="py-3 px-2 font-medium">{inv.plan}</td>
                  <td className="py-3 px-2 font-bold">{inv.amount}</td>
                  <td className="py-3 px-2 text-editorial-neutral">{inv.gateway}</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => alert(`Downloading PDF Receipt for ${inv.id}`)}
                      className="inline-flex items-center gap-1 text-editorial-red hover:underline font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
