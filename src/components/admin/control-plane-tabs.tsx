"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Building2, CreditCard, Gift, KeyRound, LayoutDashboard, Menu, Users, X } from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", href: "/admin", icon: LayoutDashboard },
  { id: "agencies", label: "Agencies", href: "/admin/agencies", icon: Building2 },
  { id: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { id: "offers", label: "Offers", href: "/admin/offers", icon: Gift },
  { id: "staff", label: "Staff", href: "/admin/staff", icon: Users },
  { id: "mcp", label: "MCP Studio", href: "/admin/mcp", icon: KeyRound },
];

export function ControlPlaneTabs() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeTab = pathname === "/admin"
    ? "overview"
    : tabs.find((tab) => tab.id !== "overview" && pathname.startsWith(tab.href))?.id || "overview";
  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label || "Overview";

  const navigation = (mobile = false) => (
    <nav className="space-y-1" aria-label="Control plane navigation">
      {tabs.map(({ id, label, href, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          onClick={() => mobile && setMobileOpen(false)}
          aria-current={activeTab === id ? "page" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === id ? "bg-editorial-black text-white" : "text-editorial-muted hover:bg-editorial-paper hover:text-editorial-black"}`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-editorial-border pb-3 lg:hidden">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-editorial-red">Control plane</p>
          <p className="mt-1 text-sm font-bold uppercase">{activeLabel}</p>
        </div>
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open control plane menu" className="border border-editorial-border bg-white p-2 text-editorial-black">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <aside className="hidden w-56 shrink-0 border-r border-editorial-border bg-editorial-bg px-4 py-6 lg:block">
        <div className="mb-7 px-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-editorial-red">Platform operations</p>
          <h2 className="mt-2 font-heading text-xl font-bold uppercase tracking-tight">Control Plane</h2>
        </div>
        {navigation()}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close control plane menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/40" />
          <aside className="relative h-full w-72 max-w-[85vw] bg-editorial-bg p-5 shadow-2xl">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-editorial-red">Platform operations</p>
                <h2 className="mt-2 font-heading text-xl font-bold uppercase tracking-tight">Control Plane</h2>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="border border-editorial-border bg-white p-2"><X className="h-5 w-5" /></button>
            </div>
            {navigation(true)}
          </aside>
        </div>
      )}
    </>
  );
}
