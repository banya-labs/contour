"use client";

import { useEffect, useState } from "react";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";

export function ProfilePhoneEditor() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/profile/phone").then((response) => response.json()).then((data) => {
      if (data.success) setPhone(data.phone || "");
    }).catch(() => undefined);
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile/phone", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: phone || null }) });
      const data = await response.json();
      setMessage(response.ok ? "WhatsApp number updated." : data.error || "Unable to update WhatsApp number.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-editorial-border bg-neutral-50 p-4">
      <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted">Your WhatsApp number</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
        <PhoneNumberInput value={phone} onChange={setPhone} label="" className="flex-1" />
        <button type="button" onClick={() => void save()} disabled={saving} className="bg-editorial-black px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-50">{saving ? "Saving…" : "Save number"}</button>
      </div>
      {message && <p className="mt-2 text-xs text-editorial-muted">{message}</p>}
    </div>
  );
}
