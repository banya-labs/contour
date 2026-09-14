"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CheckCircle2, Clock3, CreditCard, Download, FileText, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { CONTOUR_PLANS, getPlanPrice, type BillingCycle, type SupportedCurrency } from "@/lib/lenco";

type BillingData = {
  subscription: { planId: "starter" | "growth" | "enterprise" | null; planName: string; status: string; trialEndsAt: string; nextPaymentAt: string | null; nextPayment: { amount: number; formatted: string; currency: string; cycle: string } | null; lastPayment: { id: string; amount: number; currency: string; completedAt: string | null; createdAt: string } | null };
  payments: Array<{ id: string; reference: string; planId: string; billingCycle: string; amount: number; currency: string; status: string; failureReason: string | null; completedAt: string | null; createdAt: string; provider: string }>;
};

const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" }) : "—";

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
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load billing."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadBilling(); }, []);

  const currentPlan = billing?.subscription.planId ? CONTOUR_PLANS[billing.subscription.planId] : null;
  const status = billing?.subscription.status?.toLowerCase() || "trialing";
  const trialActive = status === "trialing";
  const trialEnded = status === "expired" || (!currentPlan && billing ? new Date(billing.subscription.trialEndsAt).getTime() < Date.now() : false);
  const plans = useMemo(() => Object.values(CONTOUR_PLANS), []);
  const nextPayment = billing?.subscription.nextPayment;

  const checkout = async (planId: "starter" | "growth" | "enterprise") => {
    setProcessingPlan(planId); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ planId, billingCycle: cycle, currency, channel: "mobile_money", mobileMoneyOperator: "mtn", phone: "+260971234567" }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || data.message || "Payment could not be started.");
      setMessage(data.message || "Payment started. Complete the authorization request to activate your plan.");
      if (data.checkoutUrl) window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
      await loadBilling();
    } catch (err) { setError(err instanceof Error ? err.message : "Payment could not be started."); }
    finally { setProcessingPlan(null); }
  };

  if (loading) return <div className="flex h-full items-center justify-center p-8 text-sm text-editorial-muted"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading billing details…</div>;

  return <div className="h-full w-full overflow-y-auto bg-[#f8f8f6] p-4 pb-24 font-geist text-editorial-black sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-8">
    <header className="flex flex-col gap-4 border-b border-editorial-border pb-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-contour-red">Workspace billing</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Plans that make the next step obvious.</h1><p className="mt-2 max-w-2xl text-sm text-editorial-muted">See exactly where your workspace stands, compare what each plan unlocks, and keep a clean record of payments.</p></div><div className="flex flex-wrap gap-2"><div className="inline-flex border border-editorial-border bg-white p-1 text-xs">{(["ZMW", "USD"] as SupportedCurrency[]).map((item) => <button key={item} onClick={() => setCurrency(item)} className={`px-3 py-2 font-semibold ${currency === item ? "bg-editorial-black text-white" : "text-editorial-muted"}`}>{item}</button>)}</div><div className="inline-flex border border-editorial-border bg-white p-1 text-xs">{(["MONTHLY", "ANNUAL"] as BillingCycle[]).map((item) => <button key={item} onClick={() => setCycle(item)} className={`px-3 py-2 font-semibold ${cycle === item ? "bg-editorial-black text-white" : "text-editorial-muted"}`}>{item === "ANNUAL" ? "Annual · 2 months free" : "Monthly"}</button>)}</div></div></header>
    {message && <div className="flex items-center gap-3 border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="h-5 w-5" />{message}</div>}{error && <div className="flex items-center gap-3 border border-red-300 bg-red-50 p-4 text-sm text-red-900"><TriangleAlert className="h-5 w-5" />{error}</div>}
    <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]"><div className="border border-editorial-black bg-editorial-black p-6 text-white"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Workspace access</p><h2 className="mt-2 font-heading text-2xl font-bold">{currentPlan?.name || "14-day free trial"}</h2></div><span className="border border-white/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">{status.replace("_", " ")}</span></div><p className="mt-4 max-w-md text-sm leading-6 text-white/70">{trialActive ? `Your trial ends ${date(billing?.subscription.trialEndsAt)}. Choose a paid tier before then to keep your workspace active.` : trialEnded ? "Your trial has ended. Choose a tier to restore workspace access." : "Your paid workspace is active. Plan changes take effect through the billing flow."}</p><a href="#plans" className="mt-6 inline-flex items-center gap-2 bg-contour-red px-4 py-3 text-xs font-bold uppercase tracking-wider text-white">{trialActive || trialEnded ? "Choose a tier" : "Change plan"}<ArrowRight className="h-4 w-4" /></a></div><div className="border border-editorial-border bg-white p-6"><p className="text-[11px] font-bold uppercase tracking-wider text-editorial-muted">Next payment</p><p className="mt-3 font-heading text-2xl font-bold">{nextPayment?.formatted || "Not scheduled"}</p><p className="mt-2 text-sm text-editorial-muted">{billing?.subscription.nextPaymentAt && nextPayment ? `Expected ${date(billing.subscription.nextPaymentAt)} · ${nextPayment.cycle.toLowerCase()}` : "It will appear after your first successful payment."}</p><div className="mt-6 flex items-center gap-2 text-xs text-editorial-muted"><Clock3 className="h-4 w-4" /> Estimates update from successful payments.</div></div><div className="border border-editorial-border bg-white p-6"><p className="text-[11px] font-bold uppercase tracking-wider text-editorial-muted">Last payment</p><p className="mt-3 font-heading text-2xl font-bold">{billing?.subscription.lastPayment ? `${billing.subscription.lastPayment.currency} ${billing.subscription.lastPayment.amount.toLocaleString()}` : "No payments yet"}</p><p className="mt-2 text-sm text-editorial-muted">{billing?.subscription.lastPayment ? `Paid ${date(billing.subscription.lastPayment.completedAt || billing.subscription.lastPayment.createdAt)}` : "Your first receipt will appear here after checkout."}</p><div className="mt-6 flex items-center gap-2 text-xs text-editorial-muted"><ShieldCheck className="h-4 w-4" /> Payment records are workspace-scoped.</div></div></section>
    <section id="plans" className="scroll-mt-6"><div className="mb-4 flex items-end justify-between"><div><h2 className="font-heading text-xl font-bold">Choose your tier</h2><p className="mt-1 text-sm text-editorial-muted">Your trial stays free for 14 days. Select a paid tier when you are ready to continue.</p></div><span className="text-xs font-semibold text-editorial-muted">{cycle === "ANNUAL" ? "Annual billing" : "Monthly billing"} · {currency}</span></div><div className="grid gap-4 lg:grid-cols-3">{plans.map((plan) => { const active = currentPlan?.id === plan.id; const price = getPlanPrice(plan.id, cycle, currency); return <article key={plan.id} className={`flex flex-col border bg-white p-6 ${active ? "border-editorial-black ring-2 ring-editorial-black/10" : "border-editorial-border"}`}><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-contour-red">{plan.badge}</p><h3 className="mt-2 font-heading text-xl font-bold">{plan.name}</h3></div>{active && <span className="bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-800">Current</span>}</div><p className="mt-3 min-h-10 text-sm leading-5 text-editorial-muted">{plan.description}</p><div className="mt-5 border-y border-editorial-border py-4"><span className="font-heading text-3xl font-bold">{price.formatted}</span><span className="ml-1 text-xs text-editorial-muted">/ {cycle === "ANNUAL" ? "year" : "month"}</span></div><div className="mt-5 space-y-3 text-sm">{plan.features.map((feature) => <div key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{feature}</span></div>)}</div><button disabled={active || processingPlan !== null} onClick={() => void checkout(plan.id)} className={`mt-6 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider ${active ? "cursor-default bg-[#f0f0ed] text-editorial-muted" : "bg-editorial-black text-white hover:bg-contour-red"}`}>{processingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? "Current plan" : trialActive ? `Choose ${plan.name}` : `Move to ${plan.name}`} {!active && processingPlan !== plan.id && <ArrowRight className="h-4 w-4" />}</button></article>; })}</div></section>
    <section className="border border-editorial-border bg-white p-5 sm:p-6"><div className="flex flex-col gap-2 border-b border-editorial-border pb-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-heading text-xl font-bold">Payment history</h2><p className="mt-1 text-sm text-editorial-muted">Completed payments have a downloadable receipt. Pending and failed attempts stay visible for clarity.</p></div><CreditCard className="h-5 w-5 text-editorial-muted" /></div><div className="divide-y divide-editorial-border">{billing?.payments.length ? billing.payments.map((payment) => <div key={payment.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{payment.currency} {payment.amount.toLocaleString()}</span><span className="rounded-full bg-[#f0f0ed] px-2 py-1 text-[10px] font-bold uppercase">{payment.status}</span></div><p className="mt-1 text-xs text-editorial-muted">{CONTOUR_PLANS[payment.planId]?.name || payment.planId} · {payment.billingCycle.toLowerCase()} · {date(payment.completedAt || payment.createdAt)}</p>{payment.failureReason && <p className="mt-1 text-xs text-red-700">{payment.failureReason}</p>}</div>{payment.status === "SUCCESS" ? <a href={`/api/billing/payments/${payment.id}/receipt?download=1`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-contour-red"><Download className="h-4 w-4" /> Download receipt</a> : <span className="text-xs text-editorial-muted">Receipt available after payment</span>}</div>) : <div className="py-10 text-center"><FileText className="mx-auto h-8 w-8 text-editorial-muted" /><p className="mt-3 text-sm font-semibold">No payment history yet</p><p className="mt-1 text-sm text-editorial-muted">Your completed payments and receipts will appear here.</p></div>}</div></section>
  </div></div>;
}
