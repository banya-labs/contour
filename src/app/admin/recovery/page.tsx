"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

export default function AdminRecoveryPage() {
  const [organizationId, setOrganizationId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  async function recover(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/admin/agencies/state", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationId, accountStatus: "ACTIVE", reason }) }); const data = await response.json(); setMessage(response.ok ? "Agency reactivated and recovery audited." : data.error || "Unable to reactivate agency."); if (response.ok) { setOrganizationId(""); setReason(""); } }
  return <main className="min-h-screen bg-editorial-bg px-4 py-6 font-geist text-editorial-black sm:px-8"><div className="mx-auto max-w-2xl space-y-7"><Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-editorial-muted hover:text-editorial-red"><ArrowLeft className="h-4 w-4" /> Control Plane</Link><header className="border-b border-editorial-border pb-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-red">Platform governance // recovery</p><h1 className="mt-2 font-heading text-4xl font-bold uppercase">Agency recovery</h1><p className="mt-2 text-sm text-editorial-muted">Reactivate a locked or suspended agency. This action is reversible and audited.</p></header><form onSubmit={recover} className="space-y-4 border border-editorial-border bg-white p-6"><div className="flex items-center gap-3"><RotateCcw className="h-5 w-5 text-emerald-700" /><h2 className="font-serif text-2xl font-bold">Restore workspace access</h2></div><input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} required placeholder="Agency organization ID" className="h-11 w-full border border-editorial-border px-3 font-mono text-sm" /><textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={20} placeholder="Reason for restoring access (minimum 20 characters)" className="min-h-24 w-full border border-editorial-border p-3 text-sm" /><button className="bg-editorial-black px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-editorial-red">Reactivate and audit</button>{message && <p className="text-sm text-editorial-muted">{message}</p>}</form></div></main>;
}
