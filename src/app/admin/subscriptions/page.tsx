"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";

type Subscription = { id: string; name: string; slug: string; subscriptionTier: string; subscriptionStatus: string; trialEndsAt: string | null; _count: { members: number; properties: number; inquiries: number }; lastPayment: { amount: number; currency: string; billingCycle: string; completedAt: string | null; planId: string } | null };

export default function AdminSubscriptionsPage() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("Loading subscription ledger…");
  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: "1", pageSize: "50" });
    if (status) params.set("status", status);
    const response = await fetch(`/api/admin/subscriptions?${params}`);
    const data = await response.json();
    setItems(data.subscriptions || []);
    setMessage(response.ok ? "" : data.error || "Unable to load subscriptions.");
  }, [status]);
  useEffect(() => { void load(); }, [load]);

  return <main className="min-h-screen bg-editorial-bg px-4 py-6 font-geist text-editorial-black sm:px-8"><div className="mx-auto max-w-7xl space-y-7"><Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-editorial-muted hover:text-editorial-red"><ArrowLeft className="h-4 w-4" /> Control Plane</Link><header className="flex flex-col gap-4 border-b border-editorial-border pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-red">Platform finance // read-only</p><h1 className="mt-2 font-heading text-4xl font-bold uppercase">Subscription ledger</h1><p className="mt-2 text-sm text-editorial-muted">Plan, trial, payment, and bounded usage visibility. No billing mutations are available from this view.</p></div><CreditCard className="hidden h-8 w-8 text-editorial-red sm:block" /></header><div className="flex items-center justify-between border border-editorial-border bg-white p-4"><span className="text-xs font-bold uppercase tracking-widest text-editorial-muted">{items.length} records loaded</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 border border-editorial-border px-3 text-sm"><option value="">All states</option><option value="active">Active</option><option value="trialing">Trialing</option><option value="past_due">Past due</option><option value="suspended">Suspended</option></select></div>{message && <p className="text-sm text-editorial-muted">{message}</p>}<section className="overflow-x-auto border border-editorial-border bg-white"><table className="w-full min-w-[980px] text-left"><thead className="border-b border-editorial-border bg-editorial-paper"><tr className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted"><th className="px-5 py-4">Agency</th><th className="px-5 py-4">State</th><th className="px-5 py-4">Last payment</th><th className="px-5 py-4">Team</th><th className="px-5 py-4">Listings</th><th className="px-5 py-4">Inquiries</th><th className="px-5 py-4">Trial ends</th></tr></thead><tbody className="divide-y divide-editorial-border">{items.map((item) => <tr key={item.id} className="hover:bg-editorial-hover"><td className="px-5 py-4"><div className="font-bold">{item.name}</div><div className="font-mono text-[10px] text-editorial-muted">{item.subscriptionTier}</div></td><td className="px-5 py-4 text-xs font-bold uppercase">{item.subscriptionStatus}</td><td className="px-5 py-4 font-mono text-xs">{item.lastPayment ? `${item.lastPayment.currency} ${item.lastPayment.amount.toLocaleString()} · ${item.lastPayment.billingCycle}` : "No successful payment"}</td><td className="px-5 py-4 font-mono text-sm">{item._count.members}</td><td className="px-5 py-4 font-mono text-sm">{item._count.properties}</td><td className="px-5 py-4 font-mono text-sm">{item._count.inquiries}</td><td className="px-5 py-4 text-xs text-editorial-muted">{item.trialEndsAt ? new Date(item.trialEndsAt).toLocaleDateString() : "—"}</td></tr>)}</tbody></table>{items.length === 0 && !message && <p className="p-8 text-center text-sm text-editorial-muted">No subscriptions match this filter.</p>}</section></div></main>;
}
