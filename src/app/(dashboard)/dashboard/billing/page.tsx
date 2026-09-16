"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
  TriangleAlert,
  Sparkles,
} from "lucide-react";
import { CONTOUR_PLANS, getPlanPrice, type BillingCycle, type SupportedCurrency } from "@/lib/lenco";
import { ContourLogo } from "@/components/brand/contour-logo";

type BillingData = {
  subscription: {
    planId: "starter" | "growth" | "enterprise" | null;
    planName: string;
    status: string;
    trialEndsAt: string;
    nextPaymentAt: string | null;
    nextPayment: { amount: number; formatted: string; currency: string; cycle: string } | null;
    lastPayment: { id: string; amount: number; currency: string; completedAt: string | null; createdAt: string } | null;
  };
  payments: Array<{
    id: string;
    reference: string;
    planId: string;
    billingCycle: string;
    amount: number;
    currency: string;
    status: string;
    failureReason: string | null;
    completedAt: string | null;
    createdAt: string;
    provider: string;
  }>;
};

const date = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("en-ZM", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [currency, setCurrency] = useState<SupportedCurrency>("ZMW");
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBilling = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/billing/summary", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load billing.");
      setBilling(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load billing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBilling();
  }, []);

  const currentPlan = billing?.subscription.planId ? CONTOUR_PLANS[billing.subscription.planId] : null;
  const status = billing?.subscription.status?.toLowerCase() || "trialing";
  const trialActive = status === "trialing";
  const trialEnded =
    status === "expired" ||
    (!currentPlan && billing ? new Date(billing.subscription.trialEndsAt).getTime() < Date.now() : false);
  const plans = useMemo(() => Object.values(CONTOUR_PLANS), []);
  const nextPayment = billing?.subscription.nextPayment;

  const checkout = async (planId: "starter" | "growth" | "enterprise") => {
    setProcessingPlan(planId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          planId,
          billingCycle: cycle,
          currency,
          channel: "mobile_money",
          mobileMoneyOperator: "mtn",
          phone: "+260971234567",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || data.message || "Payment could not be started.");
      setMessage(data.message || "Payment started. Complete the authorization request to activate your plan.");
      if (data.checkoutUrl) window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
      await loadBilling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be started.");
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-editorial-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-contour-red" />
        <span>Loading billing details…</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#f8f8f6] p-4 pb-28 font-geist text-editorial-black sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        {/* Header with Contour Logo Stamp */}
        <header className="flex flex-col gap-4 border-b border-editorial-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ContourLogo size="sm" compact />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-contour-red">
                Workspace Billing &amp; Tiers
              </span>
              <span className="text-[9px] font-mono bg-neutral-100 px-1.5 py-0.5 border border-editorial-border text-editorial-muted uppercase">
                Zambia DPA
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-editorial-black">
              Plans that make the next step obvious.
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-editorial-muted leading-relaxed">
              Track your workspace license, compare tier capabilities, and review immutable payment records reconciled via Lenco.
            </p>
          </div>

          {/* Currency & Cycle Switchers (Mobile Full-Width Responsive) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <div className="inline-flex border border-editorial-border bg-white p-1 text-xs justify-center">
              {(["ZMW", "USD"] as SupportedCurrency[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setCurrency(item)}
                  className={`px-3 py-1.5 sm:py-2 font-semibold transition-colors flex-1 sm:flex-initial text-center ${
                    currency === item ? "bg-editorial-black text-white" : "text-editorial-muted hover:text-editorial-black"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="inline-flex border border-editorial-border bg-white p-1 text-xs justify-center">
              {(["MONTHLY", "ANNUAL"] as BillingCycle[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setCycle(item)}
                  className={`px-3 py-1.5 sm:py-2 font-semibold transition-colors flex-1 sm:flex-initial text-center ${
                    cycle === item ? "bg-editorial-black text-white" : "text-editorial-muted hover:text-editorial-black"
                  }`}
                >
                  {item === "ANNUAL" ? "Annual · 2 mos free" : "Monthly"}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Notifications */}
        {message && (
          <div className="flex items-center gap-3 border border-emerald-300 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-900 shadow-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 border border-red-300 bg-red-50 p-4 text-xs sm:text-sm text-red-900 shadow-xs">
            <TriangleAlert className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Overview KPI Cards */}
        <section className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Active Workspace Access Card */}
          <div className="border border-editorial-black bg-editorial-black p-5 sm:p-6 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-white/60">
                    Workspace Access
                  </p>
                  <h2 className="mt-1.5 font-heading text-xl sm:text-2xl font-bold">
                    {currentPlan?.name || "14-Day Free Trial"}
                  </h2>
                </div>
                <span className="border border-white/30 px-2 py-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
                  {status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/70">
                {trialActive
                  ? `Your trial ends ${date(billing?.subscription.trialEndsAt)}. Choose a paid tier before then to keep your workspace active.`
                  : trialEnded
                  ? "Your trial has ended. Choose a tier to restore workspace access."
                  : "Your paid workspace is active. Plan changes take effect through the billing flow."}
              </p>
            </div>
            <a
              href="#plans"
              className="mt-5 inline-flex items-center justify-center gap-2 bg-contour-red hover:bg-contour-red/90 px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors w-full sm:w-auto"
            >
              <span>{trialActive || trialEnded ? "Choose a Tier" : "Change Plan"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Next Payment Card */}
          <div className="border border-editorial-border bg-white p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-editorial-muted">
                Next Payment
              </p>
              <p className="mt-2 font-heading text-xl sm:text-2xl font-bold text-editorial-black">
                {nextPayment?.formatted || "Not scheduled"}
              </p>
              <p className="mt-1.5 text-xs text-editorial-muted leading-relaxed">
                {billing?.subscription.nextPaymentAt && nextPayment
                  ? `Expected ${date(billing.subscription.nextPaymentAt)} · ${nextPayment.cycle.toLowerCase()}`
                  : "It will appear after your first successful payment."}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-editorial-muted pt-3 border-t border-editorial-border">
              <Clock3 className="h-3.5 w-3.5 text-editorial-muted" />
              <span>Estimates update from successful payments.</span>
            </div>
          </div>

          {/* Last Payment Card */}
          <div className="border border-editorial-border bg-white p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-editorial-muted">
                Last Payment
              </p>
              <p className="mt-2 font-heading text-xl sm:text-2xl font-bold text-editorial-black">
                {billing?.subscription.lastPayment
                  ? `${billing.subscription.lastPayment.currency} ${billing.subscription.lastPayment.amount.toLocaleString()}`
                  : "No payments yet"}
              </p>
              <p className="mt-1.5 text-xs text-editorial-muted leading-relaxed">
                {billing?.subscription.lastPayment
                  ? `Paid ${date(billing.subscription.lastPayment.completedAt || billing.subscription.lastPayment.createdAt)}`
                  : "Your first receipt will appear here after checkout."}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-editorial-muted pt-3 border-t border-editorial-border">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Payment records are workspace-scoped.</span>
            </div>
          </div>
        </section>

        {/* Tier Comparison Section */}
        <section id="plans" className="scroll-mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-editorial-border pb-3">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold uppercase tracking-tight text-editorial-black">
                Choose your tier
              </h2>
              <p className="mt-0.5 text-xs text-editorial-muted">
                Your trial stays free for 14 days. Select a paid tier when you are ready to continue.
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-editorial-muted bg-white px-2 py-1 border border-editorial-border shrink-0 self-start sm:self-auto">
              {cycle === "ANNUAL" ? "Annual Billing" : "Monthly Billing"} · {currency}
            </span>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const active = currentPlan?.id === plan.id;
              const price = getPlanPrice(plan.id, cycle, currency);

              return (
                <article
                  key={plan.id}
                  className={`flex flex-col justify-between border bg-white p-5 sm:p-6 transition-all ${
                    active
                      ? "border-editorial-black ring-2 ring-editorial-black/10 shadow-sm"
                      : "border-editorial-border hover:border-editorial-black"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-contour-red">
                          {plan.badge}
                        </p>
                        <h3 className="mt-1 font-heading text-lg sm:text-xl font-bold text-editorial-black">
                          {plan.name}
                        </h3>
                      </div>
                      {active && (
                        <span className="bg-emerald-100 px-2 py-0.5 text-[9px] font-mono font-bold uppercase text-emerald-800 border border-emerald-200">
                          Current
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-editorial-muted min-h-[36px]">
                      {plan.description}
                    </p>

                    <div className="mt-4 border-y border-editorial-border py-3.5">
                      <span className="font-heading text-2xl sm:text-3xl font-bold text-editorial-black">
                        {price.formatted}
                      </span>
                      <span className="ml-1 text-xs text-editorial-muted">
                        / {cycle === "ANNUAL" ? "year" : "month"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2.5 text-xs">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span className="text-editorial-black leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={active || processingPlan !== null}
                    onClick={() => void checkout(plan.id)}
                    className={`mt-6 flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider transition-colors ${
                      active
                        ? "cursor-default bg-neutral-100 text-editorial-muted border border-neutral-200"
                        : "bg-editorial-black text-white hover:bg-contour-red"
                    }`}
                  >
                    {processingPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : active ? (
                      "Current plan"
                    ) : trialActive ? (
                      `Choose ${plan.name}`
                    ) : (
                      `Move to ${plan.name}`
                    )}
                    {!active && processingPlan !== plan.id && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* Payment History Section */}
        <section className="border border-editorial-border bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-2 border-b border-editorial-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold uppercase tracking-tight text-editorial-black">
                Payment History &amp; Receipts
              </h2>
              <p className="mt-0.5 text-xs text-editorial-muted">
                Completed payments have a downloadable receipt. Pending and failed attempts stay visible for clarity.
              </p>
            </div>
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-editorial-muted" />
          </div>

          <div className="divide-y divide-editorial-border">
            {billing?.payments.length ? (
              billing.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-bold text-xs sm:text-sm text-editorial-black">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border ${
                          payment.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : payment.status === "FAILED"
                            ? "bg-red-50 text-red-800 border-red-200"
                            : "bg-neutral-100 text-editorial-muted border-neutral-200"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] sm:text-xs text-editorial-muted">
                      {CONTOUR_PLANS[payment.planId]?.name || payment.planId} · {payment.billingCycle.toLowerCase()} ·{" "}
                      {date(payment.completedAt || payment.createdAt)}
                    </p>
                    {payment.failureReason && (
                      <p className="mt-1 text-xs text-red-700">{payment.failureReason}</p>
                    )}
                  </div>

                  {payment.status === "SUCCESS" ? (
                    <a
                      href={`/api/billing/payments/${payment.id}/receipt?download=1`}
                      className="inline-flex min-h-[40px] items-center justify-center gap-2 border border-editorial-border bg-white px-3 py-2 text-xs font-heading font-bold uppercase tracking-wider text-contour-red hover:bg-neutral-50 transition-colors self-start sm:self-auto"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Receipt</span>
                    </a>
                  ) : (
                    <span className="text-xs text-editorial-muted">Receipt available after payment</span>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-8 w-8 text-editorial-muted/40" />
                <p className="mt-3 text-xs sm:text-sm font-semibold text-editorial-black">No payment history yet</p>
                <p className="mt-1 text-xs text-editorial-muted">Your completed payments and receipts will appear here.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
