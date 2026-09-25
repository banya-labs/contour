"use client";

import { useState } from "react";
import { Eye, ShieldAlert } from "lucide-react";

type SupportMode = "VIEW_ONLY" | "ACT_AS";

export function AgencySupportActions({ organizationId, agencyName }: { organizationId: string; agencyName: string }) {
  const [mode, setMode] = useState<SupportMode | null>(null);
  const [reason, setReason] = useState("");
  const [starting, setStarting] = useState(false);
  const minimumReason = mode === "ACT_AS" ? 20 : 8;
  async function startAccess() {
    if (!mode || reason.trim().length < minimumReason) return;
    const popup = window.open("about:blank", "contour-support-workspace", "popup,width=1440,height=960");
    setStarting(true);
    const response = await fetch("/api/admin/support-access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationId, reason: reason.trim(), mode, durationMinutes: mode === "ACT_AS" ? 15 : 30 }) });
    const data = await response.json().catch(() => ({}));
    setStarting(false);
    if (!response.ok) { popup?.close(); window.alert(data.error || "Unable to start support access."); return; }
    if (popup) popup.location.href = data.access.redirectPath; else window.location.assign(data.access.redirectPath);
    setMode(null); setReason("");
  }
  return <><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setMode("VIEW_ONLY")} className="inline-flex items-center gap-2 border border-editorial-border px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:border-editorial-red"><Eye className="h-3.5 w-3.5" /> View support</button><button type="button" onClick={() => setMode("ACT_AS")} className="inline-flex items-center gap-2 bg-editorial-black px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-editorial-red"><ShieldAlert className="h-3.5 w-3.5" /> Act as agency</button></div>{mode && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg border border-editorial-border bg-white p-6 shadow-2xl"><p className="text-[10px] font-bold uppercase tracking-widest text-editorial-red">Governed support access</p><h2 className="mt-2 font-serif text-2xl font-bold">{mode === "ACT_AS" ? "Act as agency" : "View support workspace"}</h2><p className="mt-2 text-sm text-editorial-muted">{agencyName} · {mode === "ACT_AS" ? "Audited agency-owner session, maximum 15 minutes." : "Read-only support workspace, maximum 30 minutes."}</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={minimumReason} required placeholder={`Reason for this session (minimum ${minimumReason} characters)`} className="mt-5 min-h-24 w-full border border-editorial-border p-3 text-sm" /><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => { setMode(null); setReason(""); }} className="border border-editorial-border px-4 py-2 text-xs font-bold uppercase">Cancel</button><button type="button" disabled={starting || reason.trim().length < minimumReason} onClick={() => void startAccess()} className="bg-editorial-black px-4 py-2 text-xs font-bold uppercase text-white disabled:opacity-50">{starting ? "Opening workspace…" : "Open popup"}</button></div></div></div>}</>;
}
