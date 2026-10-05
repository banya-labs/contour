"use client";

import { usePageUrlState } from "@/hooks/use-page-url-state";
import { consumeCreationLink } from "@/lib/page-url-state";
import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Search, Users } from "lucide-react";
import { contactSchema } from "@/lib/validations/contact";
import { ContactEditorDialog } from "@/components/contacts/contact-editor-dialog";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Contact = { id: string; name: string; phone: string; email?: string | null; notes?: string | null; _count?: { inquiries: number } };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = usePageUrlState<string>("search", "");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const saveInFlight = useRef(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const searchParams = useSearchParams();

  useEffect(() => {
    if (open) return;
    let cancelled = false;
    void fetch(`/api/contacts?search=${encodeURIComponent(search)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to load contacts.");
        if (!cancelled) setContacts(data.contacts);
      })
      .catch((error) => { if (!cancelled) setError(error instanceof Error ? error.message : "Unable to load contacts."); });
    return () => { cancelled = true; };
  }, [search, open]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", notes: "" });
    setError("");
    setOpen(true);
  };

  useEffect(() => {
    if (consumeCreationLink()) openCreate();
  }, [searchParams]);

  const openEdit = (contact: Contact) => {
    setEditing(contact);
    setForm({ name: contact.name, phone: contact.phone, email: contact.email || "", notes: contact.notes || "" });
    setError("");
    setOpen(true);
  };

  const saveContact = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saveInFlight.current) return;
    setError("");
    const validated = contactSchema.safeParse(form);
    if (!validated.success) { setError(validated.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")); return; }
    saveInFlight.current = true;
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/contacts/${editing.id}` : "/api/contacts", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validated.data) });
      const data = await response.json();
      if (!response.ok || !data.success || !data.contact?.id) { setError(data.error || `Unable to ${editing ? "update" : "create"} contact.`); return; }
      if (editing) setContacts((current) => current.map((contact) => contact.id === editing.id ? { ...contact, ...data.contact } : contact));
      else setContacts((current) => [data.contact, ...current]);
      setOpen(false);
      setEditing(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save contact.");
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  return <main className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-4 sm:space-y-6 w-full h-full overflow-y-auto font-geist text-editorial-black">
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-editorial-border pb-4 sm:pb-6">
      <div>
        <span className="text-[10px] sm:text-[11px] font-mono font-bold text-editorial-red uppercase tracking-widest">CLIENT CUSTODY // CRM PIPELINE</span>
        <h1 className="font-serif text-xl sm:text-3xl font-bold text-editorial-black tracking-tight mt-0.5 sm:mt-1">Contacts</h1>
        <p className="text-xs text-editorial-neutral mt-0.5 sm:mt-1">Reusable clients connected to their inquiries and property opportunities.</p>
      </div>
      <button onClick={openCreate} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-none bg-editorial-black hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 self-start sm:self-auto"><Plus className="w-3.5 h-3.5 text-editorial-red" /> <span>Add Contact</span></button>
    </header>
    <div className="flex border-b border-editorial-border">
      <Link href="/dashboard/clients" className="px-4 py-2 text-xs font-heading font-semibold uppercase tracking-wider text-editorial-muted">Inquiries</Link>
      <Link href="/dashboard/clients?tab=contacts" aria-current="page" className="px-4 py-2 text-xs font-heading font-semibold uppercase tracking-wider border-b-2 border-contour-red">Contacts</Link>
    </div>
    <div className="bg-white rounded-none p-3 sm:p-4 border border-editorial-border flex items-center gap-2"><Search className="w-4 h-4 text-editorial-neutral shrink-0" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contacts by name, phone, or email" className="w-full bg-transparent text-xs text-editorial-black placeholder:text-editorial-neutral focus:outline-none" /></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{contacts.map((contact) => <article key={contact.id} className="border border-editorial-border bg-white p-4 space-y-3"><div className="flex items-start justify-between gap-3"><div><h2 className="font-heading font-bold uppercase tracking-tight">{contact.name}</h2><p className="text-xs text-editorial-muted">{contact.phone}</p></div><div className="flex items-center gap-2"><Users className="w-4 h-4 text-contour-red" /><button type="button" onClick={() => openEdit(contact)} aria-label={`Edit ${contact.name}`} className="text-editorial-muted hover:text-editorial-black"><Pencil className="w-3.5 h-3.5" /></button></div></div><p className="text-xs text-editorial-muted">{contact.email || "No email recorded"}</p><div className="border-t border-editorial-border pt-2 text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted">{contact._count?.inquiries || 0} inquiries</div></article>)}</div>
    {contacts.length === 0 && <div className="border border-dashed border-editorial-border p-10 text-center text-xs text-editorial-muted">No contacts found. Add a contact before recording an inquiry.</div>}
    <ContactEditorDialog open={open} editing={Boolean(editing)} form={form} saving={saving} error={error} onChange={setForm} onSubmit={saveContact} onClose={() => { if (!saveInFlight.current) setOpen(false); }} />
  </main>;
}
