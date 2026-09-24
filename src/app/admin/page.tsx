import Link from "next/link";
import { Activity, ArrowUpRight, Building2, CreditCard, ShieldCheck, Users } from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";

const modules = [
  { label: "Agencies", description: "Tenant directory and controlled agency access.", icon: Building2, status: "Available", href: "/admin/agencies" },
  { label: "People", description: "Platform staff and agency membership oversight.", icon: Users, status: "Available", href: "/admin/staff" },
  { label: "Subscriptions", description: "Plans, trials, payments, discounts, and offers.", icon: CreditCard, status: "Planned", href: undefined },
  { label: "Audit trail", description: "Administrative actions with actor and reason.", icon: ShieldCheck, status: "Foundation active", href: undefined },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-editorial-bg px-4 py-5 font-geist text-editorial-black sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-7xl space-y-8 pb-20">
        <header className="flex flex-col gap-5 border-b border-editorial-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3"><ContourLogo size="sm" /><span className="border border-editorial-border bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-editorial-muted">Internal control plane</span></div>
            <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-editorial-red">Platform operations // private surface</p><h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight sm:text-5xl">Contour Control Plane</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-editorial-muted">The operator ledger for agencies, access, subscriptions, support, and platform health. Privileged actions will be introduced with explicit scope and audit evidence.</p></div>
          </div>
          <Link href="/dashboard" className="text-xs font-bold uppercase tracking-wider text-editorial-muted transition-colors hover:text-editorial-red">Back to workspace <span aria-hidden="true">↗</span></Link>
        </header>
        <section className="grid gap-4 md:grid-cols-3" aria-label="Control plane status">
          <StatusCard icon={Activity} label="Platform readiness" value="Not connected" note="Live system checks will appear here." tone="neutral" />
          <StatusCard icon={Building2} label="Agencies under management" value="Not queried" note="No tenant data is loaded in this shell." tone="neutral" />
          <StatusCard icon={ShieldCheck} label="Administrative audit" value="Foundation active" note="Bootstrap access is server-gated." tone="safe" />
        </section>
        <section><div className="mb-4 flex items-end justify-between border-b border-editorial-border pb-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-muted">Operator modules</p><h2 className="mt-1 font-serif text-2xl font-bold">Run Contour with evidence</h2></div><span className="hidden text-[10px] font-mono uppercase tracking-widest text-editorial-muted sm:block">Phase 01 / access foundation</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{modules.map(({ label, description, icon: Icon, status, href }) => { const card = <div className="flex min-h-52 flex-col justify-between border border-editorial-border bg-white p-5 shadow-subtle"><div><div className="mb-5 flex h-10 w-10 items-center justify-center border border-editorial-border bg-editorial-paper text-editorial-red"><Icon className="h-5 w-5" aria-hidden="true" /></div><h3 className="flex items-center justify-between font-serif text-lg font-bold">{label}<ArrowUpRight className="h-4 w-4 text-editorial-muted" aria-hidden="true" /></h3><p className="mt-2 text-xs leading-5 text-editorial-muted">{description}</p></div><div className="mt-6 border-t border-editorial-border pt-3 text-[10px] font-bold uppercase tracking-widest text-editorial-muted">{status}</div></div>; return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>; })}</div></section>
        <section className="border border-editorial-border bg-[#282828] p-5 text-white sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#fa3600]">Safety boundary</p><h2 className="mt-2 font-serif text-2xl font-bold">Privileged access is deliberate</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">Agency owner roles do not automatically grant platform access. Support access, impersonation, billing overrides, locks, and deletion will each require their own permission, reason, expiry or recovery path, and immutable audit event.</p></section>
      </div>
    </main>
  );
}

function StatusCard({ icon: Icon, label, value, note, tone }: { icon: typeof Activity; label: string; value: string; note: string; tone: "neutral" | "safe" }) {
  return <div className="border border-editorial-border bg-white p-5 shadow-subtle"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted">{label}</span><Icon className={tone === "safe" ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-editorial-red"} aria-hidden="true" /></div><div className="mt-4 font-mono text-xl font-bold">{value}</div><p className="mt-1 text-xs text-editorial-muted">{note}</p></div>;
}
