"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Users, X } from "lucide-react";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { PageTabs } from "@/components/ui/page-tabs";

type Contact = { id: string; name: string; phone: string; email?: string | null; notes?: string | null; _count?: { inquiries: number } };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  const loadContacts = async () => {
    const response = await fetch(`/api/contacts?search=${encodeURIComponent(search)}`);
    const data = await response.json();
    if (data.success) setContacts(data.contacts);
  };
  useEffect(() => { void loadContacts(); }, [search]);

  const createContact = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Unable to create contact."); return; }
    setContacts((current) => [data.contact, ...current]);
    setForm({ name: "", phone: "", email: "", notes: "" });
    setOpen(false);
  };

  return <main className="p-4 sm:p-8 pb-32 space-y-6 w-full h-full overflow-y-auto font-geist text-editorial-black">
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-editorial-border pb-6">
      <div><span className="text-[10px] font-heading font-bold uppercase tracking-wider text-contour-red">Inquiries</span><h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight">Contacts</h1><p className="text-xs text-editorial-muted mt-1">Reusable clients connected to their inquiries and property opportunities.</p></div>
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-editorial-black text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-2"><Plus className="w-4 h-4" /> Add Contact</button>
    </header>
    <PageTabs tabs={[{ id: "inquiries", label: "Inquiries", href: "/dashboard/clients" }, { id: "contacts", label: "Contacts", href: "/dashboard/clients?tab=contacts" }]} activeTab="contacts" />
    <div className="flex items-center gap-2 border border-editorial-border bg-white px-3 py-2"><Search className="w-4 h-4 text-editorial-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contacts by name, phone, or email" className="w-full text-xs outline-none" /></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{contacts.map((contact) => <article key={contact.id} className="border border-editorial-border bg-white p-4 space-y-3"><div className="flex items-start justify-between"><div><h2 className="font-heading font-bold uppercase tracking-tight">{contact.name}</h2><p className="text-xs text-editorial-muted">{contact.phone}</p></div><Users className="w-4 h-4 text-contour-red" /></div><p className="text-xs text-editorial-muted">{contact.email || "No email recorded"}</p><div className="border-t border-editorial-border pt-2 text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted">{contact._count?.inquiries || 0} inquiries</div></article>)}</div>
    {contacts.length === 0 && <div className="border border-dashed border-editorial-border p-10 text-center text-xs text-editorial-muted">No contacts found. Add a contact before recording an inquiry.</div>}
    {open && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><form onSubmit={createContact} className="bg-white border border-editorial-black p-5 w-full max-w-md space-y-4"><div className="flex items-center justify-between border-b border-editorial-border pb-3"><h2 className="font-heading font-bold uppercase">Add Contact</h2><button type="button" onClick={() => setOpen(false)}><X className="w-4 h-4" /></button></div>{error && <p className="p-2 bg-red-50 border border-red-200 text-xs text-red-700">{error}</p>}<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" className="w-full border border-editorial-border px-3 py-2 text-xs" /><PhoneNumberInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} label="Phone number" required /><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email (optional)" className="w-full border border-editorial-border px-3 py-2 text-xs" /><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notes (optional)" className="w-full border border-editorial-border px-3 py-2 text-xs" rows={3} /><button className="w-full bg-editorial-black text-white px-4 py-2 text-xs font-heading font-semibold uppercase">Save Contact</button></form></div>}
  </main>;
}
