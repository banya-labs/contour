"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { SectionPendingState } from "@/components/ui/section-pending-state";
import { validateClosingRequirementTemplate, type ClosingRequirementTemplate } from "@/lib/closing-workflow";

type Requirement = ClosingRequirementTemplate & { id: string; archivedAt?: string | null };
const emptyForm = (): ClosingRequirementTemplate => ({ key: "", label: "", description: "", category: "", required: true, assigneeType: "MANAGER", evidenceType: "NOTE", sortOrder: 100, active: true });
const evidenceLabels = { NOTE: "Written note", DOCUMENT: "Vault document", BOOLEAN: "Yes / no confirmation", AMOUNT: "Amount" };
const inputClass = "mt-1 w-full border border-editorial-border bg-white px-3 py-2 text-sm text-editorial-black";
const buttonClass = "min-h-11 border border-editorial-border px-3 py-2 text-xs font-semibold disabled:opacity-50";

export function ClosingRequirementsSettings() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<"new" | Requirement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    void fetch("/api/settings/closing-requirements", { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load requirements.");
      if (!controller.signal.aborted) setRequirements(data.templates || []);
    }).catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Unable to load requirements."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  const startEdit = (item: "new" | Requirement) => {
    setEditor(item); setForm(item === "new" ? emptyForm() : { ...item }); setError(""); setMessage("");
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!editor || pending) return;
    setError(""); setMessage("");
    try {
      if (!Number.isInteger(form.sortOrder) || form.sortOrder < 0) throw new Error("Display order must be a whole number of zero or more.");
      const payload = validateClosingRequirementTemplate(form);
      setPending(true);
      const response = await fetch(editor === "new" ? "/api/settings/closing-requirements" : `/api/settings/closing-requirements/${encodeURIComponent(editor.id)}`, { method: editor === "new" ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save requirement.");
      setRequirements(current => [...current.filter(item => item.id !== data.template.id), data.template].sort((a, b) => a.sortOrder - b.sortOrder));
      setEditor(null); setMessage("Requirement saved. Future closing workflows will use this configuration.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save requirement."); }
    finally { setPending(false); setArchivingId(null); }
  };
  const archive = async (item: Requirement) => {
    if (pending || !window.confirm(`Archive ${item.label}? Existing deal checklists will stay unchanged.`)) return;
    setPending(true); setArchivingId(item.id); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/settings/closing-requirements/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to archive requirement.");
      setRequirements(current => current.map(requirement => requirement.id === item.id ? { ...requirement, active: false, archivedAt: new Date().toISOString() } : requirement));
      setMessage("Requirement archived for future workflows. Existing deal checklists are unchanged.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to archive requirement."); }
    finally { setPending(false); setArchivingId(null); }
  };
  const active = requirements.filter(item => item.active && !item.archivedAt).sort((a, b) => a.sortOrder - b.sortOrder);
  const categories = [...new Set(active.map(item => item.category))];

  return <section aria-labelledby="closing-settings-title" className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h2 id="closing-settings-title" className="font-heading text-xl font-bold">Closing requirements</h2><p className="mt-2 max-w-3xl text-sm text-editorial-muted">Build your agency’s checklist for Verification & Closing. Required items must be approved before a deal can be marked Won.</p></div>
      <button type="button" disabled={loading || pending || !!editor} onClick={() => startEdit("new")} className="min-h-11 shrink-0 bg-editorial-black px-4 py-2 text-xs font-bold uppercase text-white disabled:opacity-50">Add requirement</button>
    </div>
    <div className="border border-editorial-border bg-neutral-50 p-4 text-sm"><p className="font-semibold">How your checklist works</p><ol className="mt-2 list-decimal space-y-1 pl-5 text-editorial-muted"><li>Define the checks your agency needs, grouped by category.</li><li>Choose the responsible person and whether each check is required or optional.</li><li>When a deal enters Verification & Closing, it receives a copy of this checklist.</li></ol><p className="mt-3 text-xs text-editorial-muted">Changes here affect future workflows only. Existing deal checklists stay unchanged. Notes, documents and amounts support a decision; management can approve an item without an attachment.</p></div>
    {error && <div role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}{!editor && <button type="button" disabled={pending} onClick={() => setRetry(value => value + 1)} className="ml-3 underline">Reload requirements</button>}</div>}
    {message && <p role="status" className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
    {editor && <form onSubmit={save} className="border border-editorial-border bg-white p-5 space-y-5">
      <div><h3 className="font-heading text-base font-bold">{editor === "new" ? "Add a requirement" : `Edit ${editor.label}`}</h3><p className="mt-1 text-xs text-editorial-muted">Use a clear name and describe what the agency should confirm.</p></div>
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">Requirement name<input required maxLength={120} value={form.label} onChange={event => setForm(current => ({ ...current, label: event.target.value, ...(editor === "new" ? { key: (`REQ_${event.target.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_")}`).slice(0, 64) } : {}) }))} className={inputClass} placeholder="e.g. Buyer identity verified" /></label>
        <label className="text-sm font-semibold">Category<input required value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} className={inputClass} placeholder="e.g. Identity, Legal or Payment" /></label>
        <label className="text-sm font-semibold sm:col-span-2">What should be checked?<textarea required rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className={inputClass} placeholder="Explain what must be confirmed before this item is approved." /></label>
        <label className="text-sm font-semibold">Responsible person<select value={form.assigneeType} onChange={event => setForm({ ...form, assigneeType: event.target.value as ClosingRequirementTemplate["assigneeType"] })} className={inputClass}><option value="MANAGER">Manager</option><option value="AGENT">Agent</option></select><span className="mt-1 block text-xs font-normal text-editorial-muted">Who prepares or follows up on this check.</span></label>
        <label className="text-sm font-semibold">Supporting evidence<select value={form.evidenceType} onChange={event => setForm({ ...form, evidenceType: event.target.value as ClosingRequirementTemplate["evidenceType"] })} className={inputClass}>{Object.entries(evidenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span className="mt-1 block text-xs font-normal text-editorial-muted">The evidence that can support approval; an attachment is optional.</span></label>
        <label className="flex items-start gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.required} onChange={event => setForm({ ...form, required: event.target.checked })} className="mt-1" /><span><strong>Required before Won</strong><span className="mt-1 block text-xs text-editorial-muted">Uncheck for an optional supporting item.</span></span></label>
        <details className="sm:col-span-2"><summary className="cursor-pointer text-sm font-semibold">Reference and display order</summary><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className="text-sm">Requirement reference<input required pattern="[A-Z][A-Z0-9_]{2,63}" maxLength={64} value={form.key} onChange={event => setForm({ ...form, key: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} className={inputClass} /><span className="mt-1 block text-xs text-editorial-muted">A unique reference, such as BUYER_IDENTITY. Starts with a letter and uses 3–64 uppercase letters, numbers or underscores.</span></label><label className="text-sm">Display order<input required type="number" min={0} step={1} value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: Number(event.target.value) })} className={inputClass} /><span className="mt-1 block text-xs text-editorial-muted">Lower numbers appear earlier in the checklist.</span></label></div></details>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={pending} onClick={() => setEditor(null)} className={buttonClass}>Cancel</button><button disabled={pending} className="min-h-11 bg-editorial-black px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><PendingButtonContent pending={pending} pendingLabel="Saving requirement…">Save requirement</PendingButtonContent></button></div>
    </form>}
    {loading ? <SectionPendingState label="Loading closing requirements…" /> : (active.length > 0 || !error) && <div className="space-y-5"><p className="text-sm text-editorial-muted">{active.length} active requirements · {active.filter(item => item.required).length} required before Won</p>{!active.length && <p className="border border-editorial-border p-6 text-sm">No active requirements. Add a check to start your agency’s checklist.</p>}{categories.map(category => <section key={category} className="border border-editorial-border bg-white"><h3 className="border-b border-editorial-border bg-neutral-50 px-5 py-3 font-heading text-sm font-bold">{category}</h3><div className="divide-y divide-editorial-border">{active.filter(item => item.category === category).map(item => <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-semibold break-words">{item.label}</h4><span className="border border-editorial-border px-2 py-0.5 text-xs">{item.required ? "Required" : "Optional"}</span></div><p className="mt-2 text-sm text-editorial-muted break-words">{item.description}</p><p className="mt-2 text-xs text-editorial-muted">Responsible: {item.assigneeType === "MANAGER" ? "Manager" : "Agent"} · Evidence: {evidenceLabels[item.evidenceType]}</p></div><div className="flex shrink-0 gap-2"><button type="button" disabled={pending || !!editor} onClick={() => startEdit(item)} className={buttonClass}>Edit</button><button type="button" disabled={pending || !!editor} onClick={() => void archive(item)} className={`${buttonClass} text-red-700`}><PendingButtonContent pending={archivingId === item.id} pendingLabel="Archiving…">Archive</PendingButtonContent></button></div></div>)}</div></section>)}</div>}
  </section>;
}
