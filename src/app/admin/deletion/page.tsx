"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function AdminDeletionPage() {
  const [organizationId, setOrganizationId] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  async function schedule(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/admin/agencies/deletion", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationId, confirmation, reason }) }); const data = await response.json(); setMessage(response.ok ? "Deletion scheduled. The agency is in a 30-day recovery window." : data.error || "Unable to schedule deletion."); }
  return <main className="min-h-screen bg-editorial-bg px-4 py-6 font-geist text-editorial-black sm:px-8"><div className="mx-auto max-w-2xl space-y-7"><Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-editorial-muted hover:text-editorial-red"><ArrowLeft className="h-4 w-4" /> Control Plane</Link><header className="border-b border-editorial-border pb-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-red">Platform governance // destructive workflow</p><h1 className="mt-2 font-heading text-4xl font-bold uppercase">Schedule agency deletion</h1><p className="mt-2 text-sm text-editorial-muted">This does not permanently delete data. It blocks the agency and starts a 30-day recovery window.</p></header><form onSubmit={schedule} className="space-y-4 border border-editorial-red bg-white p-6"><div className="flex items-center gap-3 text-editorial-red"><AlertTriangle className="h-5 w-5" /><h2 className="font-serif text-2xl font-bold">Destructive action</h2></div><input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} required placeholder="Agency organization ID" className="h-11 w-full border border-editorial-border px-3 font-mono text-sm" /><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required placeholder="Type DELETE AGENCY" className="h-11 w-full border border-editorial-border px-3 font-mono text-sm" /><textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={30} placeholder="Reason (minimum 30 characters)" className="min-h-24 w-full border border-editorial-border p-3 text-sm" /><button className="bg-editorial-red px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700">Schedule deletion</button>{message && <p className="text-sm text-editorial-muted">{message}</p>}</form></div></main>;
}
