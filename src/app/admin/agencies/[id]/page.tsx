"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Mail, Users } from "lucide-react";
import { AgencySubscriptionEditor } from "@/components/admin/agency-subscription-editor";
import { AgencySupportActions } from "@/components/admin/agency-support-actions";
import { AgencyAccountActions } from "@/components/admin/agency-account-actions";
import { formatAgencyOwner, formatSubscriptionState } from "@/lib/admin-control-plane/formatters";

type Agency = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  createdAt: string;
  accountStatus: string;
  profile: { city: string | null; country: string } | null;
  owners: { name: string; email: string }[];
  members: { id: string; name: string; email: string; role: string; status: string; createdAt: string }[];
  subscription: { tier: string; status: string; trialEndsAt: string | null; nextPaymentAt: string | null };
  _count: { members: number; properties: number };
};

type Activity = { id: string; action: string; actor: string; createdAt: string };

export default function AdminAgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [message, setMessage] = useState("Loading agency…");

  async function load(id: string) {
    const [agencyResponse, activityResponse] = await Promise.all([
      fetch(`/api/admin/agencies/${id}`),
      fetch(`/api/admin/agencies/${id}/activity?page=1&pageSize=10`),
    ]);
    const agencyData = await agencyResponse.json();
    const activityData = await activityResponse.json();
    setAgency(agencyData.agency || null);
    setActivity(activityData.activity || []);
    setMessage(agencyResponse.ok ? "" : agencyData.error || "Unable to load agency.");
  }

  useEffect(() => { void params.then(({ id }) => load(id)); }, [params]);

  if (message && !agency) {
    return <main className="min-h-screen bg-editorial-bg px-4 py-6"><Link href="/admin/agencies" className="inline-flex items-center gap-2 text-xs font-bold uppercase"><ArrowLeft className="h-4 w-4" /> Agency directory</Link><p className="mt-6 text-sm text-editorial-muted">{message}</p></main>;
  }
  if (!agency) return null;

  const ownerText = formatAgencyOwner(agency.owners);
  return <main className="min-h-screen bg-editorial-bg px-4 py-6 font-geist text-editorial-black sm:px-8"><div className="mx-auto max-w-7xl space-y-7">
    <Link href="/admin/agencies" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-editorial-muted hover:text-editorial-red"><ArrowLeft className="h-4 w-4" /> Agency directory</Link>
    <header className="flex flex-col gap-4 border-b border-editorial-border pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-red">Platform operations // agency</p><h1 className="mt-2 font-heading text-4xl font-bold uppercase">{agency.name}</h1><p className="mt-2 font-mono text-xs text-editorial-muted">/{agency.slug} · Created {new Date(agency.createdAt).toLocaleDateString()}</p></div><div className="flex flex-wrap items-center gap-3"><span className="border border-editorial-border bg-white px-3 py-2 text-xs font-bold uppercase">{agency.accountStatus}</span><AgencySupportActions organizationId={agency.id} agencyName={agency.name} /></div></header><section className="border border-editorial-border bg-white p-5"><p className="label">Agency account controls</p><div className="mt-3"><AgencyAccountActions organizationId={agency.id} accountStatus={agency.accountStatus} onSaved={() => void load(agency.id)} /></div></section>
    {message && <p className="text-sm text-editorial-muted">{message}</p>}
    <section className="border border-editorial-border bg-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="label">Subscription</p><p className="mt-2 font-serif text-2xl font-bold">{agency.subscription.tier} · {formatSubscriptionState(agency.subscription.status)}</p><p className="mt-1 text-xs text-editorial-muted">Default currency: {agency.currency}</p></div><AgencySubscriptionEditor organizationId={agency.id} currency={agency.currency} currentTier={agency.subscription.tier} currentStatus={agency.subscription.status} trialEndsAt={agency.subscription.trialEndsAt} onSaved={() => void load(agency.id)} /></div></section>
    <section className="grid gap-4 md:grid-cols-4"><div className="border border-editorial-border bg-white p-5"><p className="label">Owner</p><p className="mt-3 text-sm font-bold">{ownerText}</p>{agency.owners[0] && <a className="mt-2 inline-flex items-center gap-2 text-xs text-editorial-red" href={`mailto:${agency.owners[0].email}`}><Mail className="h-3 w-3" /> Email owner</a>}</div><div className="border border-editorial-border bg-white p-5"><p className="label">Workspace</p><p className="mt-3 text-sm">{agency.profile?.city || agency.profile?.country || "Location not recorded"}</p><p className="mt-1 text-xs text-editorial-muted">{agency._count.properties} listings · {agency._count.members} people</p></div><div className="border border-editorial-border bg-white p-5 md:col-span-2"><div className="flex items-center gap-3"><Users className="h-4 w-4 text-editorial-red" /><p className="label">People</p></div><p className="mt-3 text-sm">{agency.members.slice(0, 3).map((member) => member.name).join(" · ") || "No members recorded"}</p></div></section>
    <section className="border border-editorial-border bg-white p-5"><div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-editorial-red" /><h2 className="font-serif text-2xl font-bold">Activity</h2></div><div className="mt-4 space-y-3">{activity.length ? activity.map((item) => <div key={item.id} className="flex justify-between border-b border-editorial-border pb-3 text-xs"><span><strong>{item.action}</strong><small className="block text-editorial-muted">Actor {item.actor}</small></span><time className="text-editorial-muted">{new Date(item.createdAt).toLocaleString()}</time></div>) : <p className="text-sm text-editorial-muted">No activity recorded.</p>}</div></section>
  </div></main>;
}
