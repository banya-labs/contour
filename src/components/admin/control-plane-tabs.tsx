"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";

const tabs = [
  { id: "overview", label: "Overview", href: "/admin" },
  { id: "agencies", label: "Agencies", href: "/admin/agencies" },
  { id: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions" },
  { id: "staff", label: "Users", href: "/admin/staff" },
  { id: "mcp", label: "MCP Studio · Coming soon" },
  { id: "lenco", label: "Lenco Zambia login", href: "https://app.lenco.co" },
];

export function ControlPlaneTabs() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const activeTab = pathname === "/admin"
    ? "overview"
    : tabs.find((tab) => tab.id !== "overview" && tab.href && pathname.startsWith(tab.href))?.id || "overview";

  async function handleSignOut() {
    await signOut();
    window.location.assign("/login");
  }

  return <aside className="flex min-h-[calc(100vh-2rem)] w-full flex-col border-editorial-border bg-editorial-bg lg:w-64 lg:shrink-0 lg:border-r lg:pr-6"><div className="border-b border-editorial-border pb-5"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-editorial-red">Contour</p><p className="mt-2 font-heading text-lg font-bold uppercase">Control plane</p></div><nav aria-label="Control plane" className="flex gap-1 overflow-x-auto py-4 lg:flex-col lg:overflow-visible">{tabs.map((tab) => { const isActive = activeTab === tab.id; const className = `shrink-0 border-l-2 px-3 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${isActive ? "border-editorial-red bg-white text-editorial-black" : "border-transparent text-editorial-muted hover:border-editorial-border hover:bg-white/60 hover:text-editorial-black"}`; return tab.href ? <Link key={tab.id} href={tab.href} aria-current={isActive ? "page" : undefined} className={className}>{tab.label}</Link> : <span key={tab.id} aria-disabled="true" className={`${className} cursor-not-allowed opacity-60`}>{tab.label}</span>; })}</nav><div className="mt-auto border-t border-editorial-border pt-4"><div className="flex items-center gap-3 px-3 py-2"><UserRound className="h-4 w-4 text-editorial-red" aria-hidden="true" /><div className="min-w-0"><p className="truncate text-xs font-bold">{session?.user?.name || "Platform user"}</p><p className="truncate text-[10px] text-editorial-muted">{session?.user?.email || "Authenticated account"}</p></div></div><button type="button" onClick={() => void handleSignOut()} className="mt-2 inline-flex w-full items-center gap-2 px-3 py-3 text-xs font-bold uppercase tracking-wider text-editorial-muted hover:bg-white hover:text-editorial-red"><LogOut className="h-4 w-4" aria-hidden="true" /> Log out</button></div></aside>;
}

