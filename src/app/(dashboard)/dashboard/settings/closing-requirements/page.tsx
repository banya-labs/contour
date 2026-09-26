"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Requirement = { id: string; key: string; label: string; description: string; category: string; required: boolean; assigneeType: string; evidenceType: string; sortOrder: number; active: boolean; archivedAt?: string | null };

export default function ClosingRequirementsSettingsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ key: "", label: "", description: "", category: "", required: true, assigneeType: "MANAGER", evidenceType: "NOTE", sortOrder: 100 });

  const load = async () => {
    const response = await fetch("/api/settings/closing-requirements", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load requirements.");
    setRequirements(data.templates || []);
  };
  useEffect(() => { void load().catch((e) => setError(e.message)); }, []);

  const createRequirement = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/settings/closing-requirements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, key: form.key.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save requirement.");
      setRequirements((current) => [...current, data.template].sort((a, b) => a.sortOrder - b.sortOrder));
      setForm({ key: "", label: "", description: "", category: "", required: true, assigneeType: "MANAGER", evidenceType: "NOTE", sortOrder: 100 });
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save requirement."); } finally { setSaving(false); }
  };

  return <main className="p-4 sm:p-6 lg:p-8 max-w-5xl space-y-6 overflow-y-auto"><div><Link href="/dashboard/settings" className="text-[10px] uppercase tracking-widest text-contour-red">Agency settings</Link><h1 className="font-heading text-2xl font-bold mt-2">Closing requirements</h1><p className="text-sm text-editorial-muted mt-1">Define what your agency needs before a deal can be marked Won.</p></div><div className="border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">Requirements are snapshotted when a deal enters Verification & Closing. Changes here apply to future deals and never rewrite an existing deal’s checklist.</div>{error && <p className="border border-red-300 bg-red-50 p-3 text-xs text-red-800">{error}</p>}<section className="bg-white border border-editorial-border p-5"><h2 className="font-heading font-bold">Active requirements</h2><div className="mt-4 divide-y divide-editorial-border">{requirements.filter((item) => item.active && !item.archivedAt).map((item) => <div key={item.id} className="py-3 flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{item.label}{item.required ? " *" : ""}</p><p className="text-xs text-editorial-muted mt-1">{item.category} · {item.assigneeType === "MANAGER" ? "Manager" : "Agent"} · {item.evidenceType}</p><p className="text-xs mt-1">{item.description}</p></div><span className="text-[10px] uppercase tracking-wider text-editorial-muted">#{item.sortOrder}</span></div>)}</div></section><section className="bg-white border border-editorial-border p-5"><h2 className="font-heading font-bold">Add agency requirement</h2><form onSubmit={createRequirement} className="grid sm:grid-cols-2 gap-3 mt-4"><input required placeholder="Key e.g. CLIENT_NRC" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className="border border-editorial-border p-2 text-sm" /><input required placeholder="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="border border-editorial-border p-2 text-sm" /><input required placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-editorial-border p-2 text-sm" /><input required type="number" min="0" placeholder="Sort order" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="border border-editorial-border p-2 text-sm" /><textarea required placeholder="What must the agency verify?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-editorial-border p-2 text-sm sm:col-span-2" rows={3} /><select value={form.assigneeType} onChange={(e) => setForm({ ...form, assigneeType: e.target.value })} className="border border-editorial-border p-2 text-sm"><option value="MANAGER">Manager-owned</option><option value="AGENT">Agent-owned</option></select><select value={form.evidenceType} onChange={(e) => setForm({ ...form, evidenceType: e.target.value })} className="border border-editorial-border p-2 text-sm"><option value="NOTE">Note</option><option value="DOCUMENT">Vault document</option><option value="BOOLEAN">Yes / no</option><option value="AMOUNT">Amount</option></select><label className="text-xs flex items-center gap-2"><input type="checkbox" checked={form.required} onChange={(e) => setForm({ ...form, required: e.target.checked })} /> Required before Won</label><button disabled={saving} className="sm:col-start-2 justify-self-end bg-editorial-black text-white px-4 py-2 text-xs font-bold uppercase disabled:opacity-50">{saving ? "Saving…" : "Add requirement"}</button></form></section></main>;
}
