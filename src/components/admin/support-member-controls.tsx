"use client";

import { useEffect, useState } from "react";

type Member = { id: string; role: string; status: string; user: { name: string; email: string } };
const roles = ["BROKER_MANAGER", "ADMIN_STAFF", "FIELD_AGENT", "FINANCE_OFFICER", "VAULT_MANAGER", "LANDLORD", "TENANT"];

export function SupportMemberControls({ sessionId }: { sessionId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [message, setMessage] = useState("Loading members…");
  const load = async () => { const response = await fetch(`/api/admin/support-access/${sessionId}/members`); const data = await response.json(); setMembers(data.members || []); setMessage(response.ok ? "" : data.error || "Unable to load members."); };
  useEffect(() => { void load(); }, [sessionId]);
  async function update(member: Member, payload: { status?: string; roleKey?: string }) { const reason = window.prompt("Reason for this member change (minimum 20 characters):"); if (!reason || reason.trim().length < 20) return; const response = await fetch(`/api/admin/support-access/${sessionId}/members`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: member.id, ...payload, reason: reason.trim() }) }); const data = await response.json(); setMessage(response.ok ? "Member change audited." : data.error || "Unable to update member."); if (response.ok) await load(); }
  return <section className="border border-editorial-border bg-white p-6"><h2 className="font-serif text-2xl font-bold">Agency members</h2>{message && <p className="mt-2 text-sm text-editorial-muted">{message}</p>}<div className="mt-4 divide-y divide-editorial-border">{members.map((member) => <div key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{member.user.name}</p><p className="text-xs text-editorial-muted">{member.user.email}</p></div><div className="flex flex-wrap items-center gap-2"><select value={member.role} onChange={(event) => void update(member, { roleKey: event.target.value })} disabled={member.role === "owner"} className="h-9 border border-editorial-border px-2 text-[10px] font-mono"><option value={member.role}>{member.role}</option>{roles.filter((role) => role !== member.role).map((role) => <option key={role}>{role}</option>)}</select><span className="text-[10px] font-bold uppercase text-editorial-muted">{member.status}</span>{member.role !== "owner" && <button onClick={() => void update(member, { status: member.status === "active" ? "suspended" : "active" })} className="border border-editorial-border px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:border-editorial-red">{member.status === "active" ? "Suspend" : "Reactivate"}</button>}</div></div>)}</div></section>;
}
