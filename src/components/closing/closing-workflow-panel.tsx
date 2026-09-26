"use client";

import { useEffect, useState } from "react";

type WorkflowItem = { id: string; key: string; label: string; description: string; category: string; required: boolean; assigneeType: "AGENT" | "MANAGER"; evidenceType: string; status: string; notes?: string | null; rejectionReason?: string | null };
type Workflow = { id: string; status: string; items: WorkflowItem[] };

export function ClosingWorkflowPanel({ inquiryId, onClose, onCompleted }: { inquiryId: string; onClose: () => void; onCompleted: () => void }) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [readiness, setReadiness] = useState<{ ready: boolean; pending: number; blocked: number }>({ ready: false, pending: 0, blocked: 0 });
  const [error, setError] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch(`/api/clients/${inquiryId}/closing-workflow`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load closing workflow.");
    setWorkflow(data.workflow);
    setReadiness(data.readiness);
  };
  useEffect(() => { void load().catch((e) => setError(e.message)); }, [inquiryId]);

  const updateItem = async (item: WorkflowItem, status: "SUBMITTED" | "APPROVED" | "REJECTED") => {
    setPendingKey(item.key); setError("");
    try {
      const response = await fetch(`/api/clients/${inquiryId}/closing-workflow/items/${item.key}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, notes: item.notes || undefined, rejectionReason: status === "REJECTED" ? "Manager requested correction." : undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update requirement.");
      setWorkflow((current) => current ? { ...current, items: current.items.map((candidate) => candidate.key === item.key ? data.item : candidate), status: data.readiness.ready ? "READY" : "OPEN" } : current);
      setReadiness(data.readiness);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update requirement."); } finally { setPendingKey(null); }
  };

  const closeWon = async () => {
    setPendingKey("__close__"); setError("");
    try {
      const response = await fetch(`/api/clients/${inquiryId}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetStage: "CLOSED", outcome: "WON" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to close this deal.");
      onCompleted(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to close this deal."); } finally { setPendingKey(null); }
  };

  return <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
    <section className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-editorial-border shadow-xl">
      <header className="p-5 border-b border-editorial-border flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-widest font-bold text-contour-red">Verification & Closing</p><h2 className="font-heading text-lg font-bold mt-1">Closing requirements</h2><p className="text-xs text-editorial-muted mt-1">Complete the agency requirements before closing this deal.</p></div><button type="button" onClick={onClose} className="text-editorial-muted hover:text-editorial-black" aria-label="Close closing workflow">×</button></header>
      {error && <p className="m-4 p-3 border border-red-300 bg-red-50 text-xs text-red-800">{error}</p>}
      {!workflow && !error && <p className="p-6 text-sm text-editorial-muted">Loading closing requirements…</p>}
      {workflow && <div className="p-5 space-y-4"><div className={`p-3 border text-xs ${readiness.ready ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900"}`}>{readiness.ready ? "Ready for manager close." : `${readiness.pending} pending, ${readiness.blocked} blocked required item(s).`}</div>{workflow.items.map((item) => <div key={item.key} className="border border-editorial-border p-3 space-y-2"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold">{item.label}{item.required ? " *" : ""}</p><p className="text-[11px] text-editorial-muted mt-1">{item.description}</p></div><span className="text-[10px] uppercase tracking-wider font-bold">{item.status}</span></div><div className="flex items-center justify-between gap-2"><span className="text-[10px] text-editorial-muted">Owner: {item.assigneeType === "MANAGER" ? "Manager" : "Assigned agent"} · Evidence: {item.evidenceType}</span><div className="flex gap-2">{item.status !== "APPROVED" && <button type="button" disabled={pendingKey === item.key} onClick={() => void updateItem(item, item.assigneeType === "MANAGER" ? "SUBMITTED" : "SUBMITTED")} className="px-2 py-1 border border-editorial-border text-[10px] font-bold uppercase disabled:opacity-50">Submit</button>}{item.status === "SUBMITTED" && <button type="button" disabled={pendingKey === item.key} onClick={() => void updateItem(item, "APPROVED")} className="px-2 py-1 bg-editorial-black text-white text-[10px] font-bold uppercase disabled:opacity-50">Approve</button>}</div></div></div>)}</div>}
      <footer className="p-4 border-t border-editorial-border flex justify-end gap-2"><button type="button" onClick={onClose} className="px-3 py-2 border border-editorial-border text-xs font-bold uppercase">Close</button>{readiness.ready && <button type="button" disabled={pendingKey === "__close__"} onClick={() => void closeWon()} className="px-3 py-2 bg-emerald-700 text-white text-xs font-bold uppercase disabled:opacity-50">{pendingKey === "__close__" ? "Closing…" : "Mark won"}</button>}</footer>
    </section>
  </div>;
}
