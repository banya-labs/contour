"use client";

import { useEffect, useState } from "react";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { SectionPendingState } from "@/components/ui/section-pending-state";

export function ProfilePhoneEditor() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setMessage(null);
    void fetch("/api/profile/phone", { signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load your WhatsApp number.");
      if (!controller.signal.aborted) setPhone(data.phone || "");
    }).catch((cause: unknown) => { if (!controller.signal.aborted) setMessage(cause instanceof Error ? cause.message : "Unable to load your WhatsApp number."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  async function save() {
    if (saving || loading) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile/phone", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: phone || null }) });
      const data = await response.json();
      setMessage(response.ok ? "WhatsApp number updated." : data.error || "Unable to update WhatsApp number.");
    } catch {
      setMessage("Unable to update WhatsApp number. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-editorial-border bg-neutral-50 p-4">
      <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted">Your WhatsApp number</p>
      {loading ? <SectionPendingState compact label="Loading your WhatsApp number…" /> : <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
        <PhoneNumberInput value={phone} onChange={setPhone} label="" className="flex-1" />
        <button type="button" onClick={() => void save()} disabled={saving} aria-busy={saving} className="bg-editorial-black px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-50"><PendingButtonContent pending={saving} pendingLabel="Saving number…">Save number</PendingButtonContent></button>
      </div>}
      {message && <p role="status" className="mt-2 text-xs text-editorial-muted">{message} <button type="button" disabled={loading || saving} onClick={() => setRetry(value => value + 1)} className="underline">Reload number</button></p>}
    </div>
  );
}
