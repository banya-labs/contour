"use client";

import { useId } from "react";
import type { FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";

export type ContactForm = { name: string; phone: string; email: string; notes: string };

type Props = {
  open: boolean;
  editing: boolean;
  form: ContactForm;
  saving: boolean;
  error: string;
  onChange: (form: ContactForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function ContactEditorDialog({ open, editing, form, saving, error, onChange, onSubmit, onClose }: Props) {
  const id = useId();
  const inputClass = "w-full min-h-11 border border-editorial-border bg-white px-3 py-2 text-base sm:text-sm";
  return (
    <Dialog open={open} layer={80} onOpenChange={(next) => { if (!next && !saving) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-5">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Contact" : "Add Contact"}</DialogTitle>
          <DialogDescription>Record a contact to connect them to inquiries and property opportunities.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" aria-busy={saving}>
          {error && <p role="alert" className="border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          <fieldset disabled={saving} className="space-y-4">
            <div><label htmlFor={`${id}-name`} className="mb-1 block text-xs font-heading font-semibold uppercase">Full name *</label>
              <input id={`${id}-name`} autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} className={inputClass} />
            </div>
            <PhoneNumberInput value={form.phone} onChange={(phone) => onChange({ ...form, phone })} label="Phone number" required disabled={saving} className="[&_input]:text-base [&_select]:min-h-11" />
            <div><label htmlFor={`${id}-email`} className="mb-1 block text-xs font-heading font-semibold uppercase">Email (optional)</label>
              <input id={`${id}-email`} type="email" autoComplete="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} className={inputClass} />
            </div>
            <div><label htmlFor={`${id}-notes`} className="mb-1 block text-xs font-heading font-semibold uppercase">Notes (optional)</label>
              <textarea id={`${id}-notes`} maxLength={1000} rows={3} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} className={inputClass} />
            </div>
          </fieldset>
          <div className="flex gap-2 border-t border-editorial-border pt-3">
            <button type="button" disabled={saving} onClick={onClose} className="min-h-11 border border-editorial-border px-4 text-xs font-heading font-semibold uppercase disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="min-h-11 flex-1 bg-editorial-black px-4 text-xs font-heading font-semibold uppercase text-white disabled:opacity-50">{saving ? "Saving…" : editing ? "Save changes" : "Save contact"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
