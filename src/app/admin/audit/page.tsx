"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, ScrollText } from "lucide-react";

type Event = { id: string; organizationId: string; userId: string | null; action: string; entityType: string; entityId: string | null; details: unknown; createdAt: string; organization: { name: string; slug: string } };

export default function AdminAuditPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Loading audit events…");
  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: "1", pageSize: "50" });
    if (query.trim()) params.set("q", query.trim());
    const response = await fetch(`/api/admin/audit?${params}`);
    const data = await response.json();
    setEvents(data.events || []);
    setMessage(response.ok ? "" : data.error || "Unable to load audit events.");
  }, [query]);
  useEffect(() => { void load(); }, [load]);
  return <main className="min-h-screen bg-editorial-bg px-4 py-6 font-geist text-editorial-black sm:px-8"><div className="mx-auto max-w-7xl space-y-7"><Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-editorial-muted"><ArrowLeft className="h-4 w-4" /> Control Plane</Link><header className="flex items-end justify-between border-b border-editorial-border pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-red">Platform governance // evidence</p><h1 className="mt-2 font-heading text-4xl font-bold uppercase">Audit log</h1><p className="mt-2 text-sm text-editorial-muted">Recent operator and agency activity, bounded for safe review.</p></div><ScrollText className="hidden h-8 w-8 text-editorial-red sm:block" /></header><div className="flex gap-3 border border-editorial-border bg-white p-4"><div className="flex flex-1 items-center gap-2 border border-editorial-border px-3"><Search className="h-4 w-4 text-editorial-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void load()} placeholder="Search action, entity type, or ID" className="h-10 flex-1 text-sm outline-none" /></div><button onClick={() => void load()} className="h-10 bg-editorial-black px-5 text-xs font-bold uppercase tracking-wider text-white">Search</button></div>{message && <p className="text-sm text-editorial-muted">{message}</p>}<section className="overflow-x-auto border border-editorial-border bg-white"><table className="w-full min-w-[900px] text-left"><thead className="border-b border-editorial-border bg-editorial-paper"><tr className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted"><th className="px-5 py-4">When</th><th className="px-5 py-4">Action</th><th className="px-5 py-4">Agency</th><th className="px-5 py-4">Entity</th><th className="px-5 py-4">Operator</th></tr></thead><tbody className="divide-y divide-editorial-border">{events.map((event) => <tr key={event.id}><td className="px-5 py-4 text-xs text-editorial-muted">{new Date(event.createdAt).toLocaleString()}</td><td className="px-5 py-4 font-mono text-xs font-bold">{event.action}</td><td className="px-5 py-4 text-sm">{event.organization.name}<div className="font-mono text-[10px] text-editorial-muted">/{event.organization.slug}</div></td><td className="px-5 py-4 text-xs">{event.entityType}{event.entityId ? <span className="font-mono text-editorial-muted"> · {event.entityId}</span> : null}</td><td className="px-5 py-4 font-mono text-xs text-editorial-muted">{event.userId || "system"}</td></tr>)}</tbody></table>{events.length === 0 && !message && <p className="p-8 text-center text-sm text-editorial-muted">No audit events match this filter.</p>}</section></div></main>;
}
