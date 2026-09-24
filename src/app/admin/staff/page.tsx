"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

type Staff = { id: string; role: string; status: string; user: { name: string; email: string }; createdAt: string };

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("READ_ONLY");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("Loading platform staff…");

  async function load() {
    const response = await fetch("/api/admin/staff");
    const data = await response.json();
    setStaff(data.staff || []);
    setMessage(response.ok ? "" : data.error || "Unable to load staff.");
  }
  useEffect(() => { void load(); }, []);

  async function addStaff(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/staff", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role, reason }) });
    const data = await response.json();
    setMessage(response.ok ? "Staff access granted." : data.error || "Unable to grant access.");
    if (response.ok) { setEmail(""); setReason(""); await load(); }
  }

  async function toggle(member: Staff) {
    const nextStatus = member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const why = window.prompt(`Reason for changing ${member.user.email} to ${nextStatus.toLowerCase()}:`);
    if (!why) return;
    const response = await fetch("/api/admin/staff", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: member.user ? undefined : member.id, email: member.user.email, status: nextStatus, reason: why }) });
    const data = await response.json();
    setMessage(response.ok ? "Staff status updated." : data.error || "Unable to update staff.");
    if (response.ok) await load();
  }

  return <main className="min-h-screen bg-editorial-bg px-4 py-6 font-geist text-editorial-black sm:px-8"><div className="mx-auto max-w-5xl space-y-7"><Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-editorial-muted hover:text-editorial-red"><ArrowLeft className="h-4 w-4" /> Control Plane</Link><header className="border-b border-editorial-border pb-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-red">Platform governance // staff</p><h1 className="mt-2 font-heading text-4xl font-bold uppercase">Internal staff access</h1><p className="mt-2 text-sm text-editorial-muted">Add existing Contour users to the platform team. Every change requires a reason and is audited.</p></header><form onSubmit={addStaff} className="grid gap-3 border border-editorial-border bg-white p-5 sm:grid-cols-[1fr_180px_1fr_auto]"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="staff@contour.com" className="h-11 border border-editorial-border px-3 text-sm" /><select value={role} onChange={(event) => setRole(event.target.value)} className="h-11 border border-editorial-border px-3 text-sm"><option>READ_ONLY</option><option>SUPPORT</option><option>OPERATIONS</option><option>FINANCE</option><option>COMPLIANCE</option><option>OWNER</option></select><input value={reason} onChange={(event) => setReason(event.target.value)} minLength={8} required placeholder="Reason for granting access" className="h-11 border border-editorial-border px-3 text-sm" /><button className="inline-flex h-11 items-center justify-center gap-2 bg-editorial-black px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-editorial-red"><UserPlus className="h-4 w-4" /> Add staff</button></form>{message && <p className="text-sm text-editorial-muted">{message}</p>}<section className="overflow-hidden border border-editorial-border bg-white"><div className="border-b border-editorial-border px-5 py-4 text-xs font-bold uppercase tracking-widest">Platform staff ({staff.length})</div><div className="divide-y divide-editorial-border">{staff.map((member) => <div key={member.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-bold">{member.user.name}</div><div className="text-xs text-editorial-muted">{member.user.email}</div></div><div className="flex items-center gap-4"><span className="font-mono text-xs">{member.role}</span><span className={member.status === "ACTIVE" ? "text-xs font-bold uppercase text-emerald-700" : "text-xs font-bold uppercase text-red-700"}>{member.status}</span><button onClick={() => void toggle(member)} className="border border-editorial-border px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:border-editorial-red">{member.status === "ACTIVE" ? "Suspend" : "Reactivate"}</button></div></div>)}</div></section></div></main>;
}
