"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PendingButtonContent } from "@/components/ui/pending-button-content";

type LeaseContext = { inquiryId: string; client: { name: string; phone: string; email?: string | null }; property: { title: string; suburb: string; rentalPrice?: unknown; currency: string } | null };

export function StartLeaseDialog({ context, onClose, onCompleted }: { context: LeaseContext; onClose: () => void; onCompleted: () => void }) {
  const [monthlyRent, setMonthlyRent] = useState(context.property?.rentalPrice ? String(context.property.rentalPrice) : "");
  const [depositAmount, setDepositAmount] = useState("");
  const [leaseStartDate, setLeaseStartDate] = useState("");
  const [leaseEndDate, setLeaseEndDate] = useState("");
  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState("1");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (pending) return; setError(""); setPending(true);
    try {
      const response = await fetch(`/api/clients/${context.inquiryId}/closing-workflow/start-lease`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monthlyRent, depositAmount, leaseStartDate, leaseEndDate, paymentDayOfMonth }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start the lease.");
      onCompleted(); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to start the lease."); } finally { setPending(false); }
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}><DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto p-0 block" onPointerDownOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }}><header className="p-5 border-b border-editorial-border"><p className="text-[10px] uppercase tracking-widest font-bold text-contour-red">Rental placement</p><DialogTitle className="font-heading text-lg font-bold mt-1 normal-case">Start lease</DialogTitle><DialogDescription className="text-xs text-editorial-muted mt-1">The deal will be marked Won only after the lease is created.</DialogDescription></header><form onSubmit={submit} className="p-5 space-y-4">
    {error && <p role="alert" className="p-3 border border-red-300 bg-red-50 text-xs text-red-800">{error}</p>}
    <div className="grid grid-cols-2 gap-3"><div className="border border-editorial-border p-3"><p className="text-[10px] uppercase tracking-wider text-editorial-muted">Client</p><p className="text-sm font-bold mt-1">{context.client.name}</p><p className="text-xs text-editorial-muted">{context.client.phone}</p></div><div className="border border-editorial-border p-3"><p className="text-[10px] uppercase tracking-wider text-editorial-muted">Property</p><p className="text-sm font-bold mt-1">{context.property?.title || "Not linked"}</p><p className="text-xs text-editorial-muted">{context.property?.suburb || ""}</p></div></div>
    <div className="grid grid-cols-2 gap-3"><label className="text-xs">Monthly rent<input required type="number" min="0.01" step="0.01" value={monthlyRent} onChange={(event) => setMonthlyRent(event.target.value)} className="mt-1 w-full border border-editorial-border p-2" /></label><label className="text-xs">Deposit<input required type="number" min="0" step="0.01" value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} className="mt-1 w-full border border-editorial-border p-2" /></label><label className="text-xs">Lease starts<input required type="date" value={leaseStartDate} onChange={(event) => setLeaseStartDate(event.target.value)} className="mt-1 w-full border border-editorial-border p-2" /></label><label className="text-xs">Lease ends<input required type="date" value={leaseEndDate} onChange={(event) => setLeaseEndDate(event.target.value)} className="mt-1 w-full border border-editorial-border p-2" /></label></div>
    <label className="block text-xs">Payment day of month<input required type="number" min="1" max="28" value={paymentDayOfMonth} onChange={(event) => setPaymentDayOfMonth(event.target.value)} className="mt-1 w-full border border-editorial-border p-2" /></label>
    <footer className="flex justify-end gap-2 border-t border-editorial-border pt-4"><button type="button" onClick={onClose} disabled={pending} className="px-3 py-2 border border-editorial-border text-xs font-bold uppercase">Cancel</button><button type="submit" disabled={pending} className="px-3 py-2 bg-editorial-black text-white text-xs font-bold uppercase disabled:opacity-50"><PendingButtonContent pending={pending} pendingLabel="Starting lease…">Start lease</PendingButtonContent></button></footer>
  </form></DialogContent></Dialog>;
}
