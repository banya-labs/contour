"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { contourBrand, contourNavigation } from "@contour/config";
import { ContourMark } from "./contour-mark";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[290px] flex-col rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[0_18px_50px_rgba(39,26,0,0.07)] lg:flex">
      <div className="flex items-center gap-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-3">
        <div className="flex size-12 items-center justify-center rounded-[16px] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
          <ContourMark className="size-7" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Contour</p>
          <p className="text-[15px] font-semibold">{contourBrand.name}</p>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Status</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium">Neon connected</p>
            <p className="text-[12px] text-[color:var(--muted)]">Dashboard and routes use live data</p>
          </div>
          <span className="rounded-full border border-[color:rgba(47,109,68,0.20)] bg-[color:rgba(47,109,68,0.08)] px-3 py-1 text-[11px] font-medium text-[color:var(--success)]">
            Live
          </span>
        </div>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-3">
        {contourNavigation.map((section) => (
          <section
            key={section.label}
            className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-3"
          >
            <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.26em] text-[color:var(--muted)]">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-[14px] px-3 py-2 text-[13px] transition-colors ${
                      active
                        ? "bg-[color:rgba(39,26,0,0.08)] font-medium text-[color:var(--foreground)]"
                        : "text-[color:var(--foreground)] hover:bg-[color:var(--surface-muted)]"
                    }`}
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="size-3.5 text-[color:var(--muted)]" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <div className="flex items-center gap-2 text-[12px] font-medium">
          <ShieldCheck className="size-4 text-[color:var(--success)]" />
          Access locked by role
        </div>
        <p className="mt-2 text-[12px] leading-5 text-[color:var(--muted)]">
          Admin, agent, finance, legal, and auditor views stay separated through shared policy.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[color:var(--warning)]" />
          <div>
            <p className="text-[12px] font-medium">Guest mode</p>
            <p className="text-[11px] text-[color:var(--muted)]">Local development friendly</p>
          </div>
        </div>
        <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-[11px] font-medium text-[color:var(--muted)]">
          No auth
        </span>
      </div>
    </aside>
  );
}
