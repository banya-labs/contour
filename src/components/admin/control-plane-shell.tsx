"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, ArrowLeft, LayoutDashboard, Building2, Users, CreditCard, Gift, BarChart3, ScrollText } from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";
import type { PlatformPermission, PlatformRole } from "@/lib/platform-authorization";
import { canPlatformRole } from "@/lib/platform-authorization";

type Actor = { userId: string; role: PlatformRole };
type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; permission: PlatformPermission };

const navigation: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, permission: "platform.read" },
  { label: "Agencies", href: "/admin/agencies", icon: Building2, permission: "agency.read" },
  { label: "Users", href: "/admin/staff", icon: Users, permission: "staff.manage" },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, permission: "billing.read" },
  { label: "Offers", href: "/admin/offers", icon: Gift, permission: "billing.read" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, permission: "platform.read" },
  { label: "Audit log", href: "/admin/audit", icon: ScrollText, permission: "audit.read" },
];

export function ControlPlaneShell({ actor, children }: { actor: Actor; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navigation.filter((item) => canPlatformRole(actor.role, item.permission));
  return (
    <div className="min-h-screen bg-editorial-bg font-geist text-editorial-black">
      <button type="button" aria-label="Open Control Plane navigation" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center border border-editorial-border bg-white lg:hidden"><Menu className="h-5 w-5" /></button>
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-editorial-border bg-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-editorial-border px-5 py-5"><div><ContourLogo size="sm" /><p className="mt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-editorial-muted">Control Plane</p></div><button type="button" aria-label="Close Control Plane navigation" onClick={() => setOpen(false)} className="lg:hidden"><X className="h-5 w-5" /></button></div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Control Plane navigation">{items.map(({ label, href, icon: Icon }) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-3 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${active ? "bg-editorial-black text-white" : "text-editorial-muted hover:bg-editorial-paper hover:text-editorial-black"}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</Link>; })}</nav>
        <div className="space-y-2 border-t border-editorial-border p-4"><div className="border border-editorial-border bg-editorial-paper p-3"><p className="text-[9px] font-bold uppercase tracking-widest text-editorial-muted">Signed in as</p><p className="mt-1 text-xs font-bold">{actor.role.replace("_", " ")}</p></div><Link href="/dashboard" className="flex items-center gap-2 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-editorial-muted hover:text-contour-red"><ArrowLeft className="h-3.5 w-3.5" />Return to workspace</Link><Link href="/sign-in" className="flex items-center gap-2 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-editorial-muted hover:text-contour-red"><LogOut className="h-3.5 w-3.5" />Sign out</Link></div>
      </aside>
      {open && <button type="button" aria-label="Close navigation overlay" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/20 lg:hidden" />}
      <main className="min-h-screen lg:pl-64">{children}</main>
    </div>
  );
}
