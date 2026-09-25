"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldAlert } from "lucide-react";

export function ImpersonationBanner() {
  const [access, setAccess] = useState<{ agencyName: string; expiresAt: string } | null>(null);
  useEffect(() => { void fetch("/api/admin/support-access/current", { cache: "no-store" }).then((response) => response.json()).then((data) => { if (data.active) setAccess(data.access); }); }, []);
  if (!access) return null;
  async function exit() { await fetch("/api/admin/support-access/current/exit", { method: "POST" }); window.location.assign("/admin/agencies"); }
  return <div className="fixed inset-x-0 top-0 z-[10000] flex min-h-12 items-center justify-between gap-3 bg-[#fa3600] px-4 py-2 text-white shadow-lg"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><ShieldAlert className="h-4 w-4" /> Acting as {access.agencyName}<span className="hidden font-normal normal-case sm:inline">· expires {new Date(access.expiresAt).toLocaleTimeString()}</span></div><button type="button" onClick={() => void exit()} className="inline-flex items-center gap-2 border border-white/60 px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-white hover:text-[#fa3600]"><LogOut className="h-3.5 w-3.5" /> Exit session</button></div>;
}
