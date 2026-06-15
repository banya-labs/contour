"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Workflow } from "lucide-react";
import { contourNavigation } from "@contour/config";
import { ContourMark } from "./contour-mark";
import { ConnectivityBadge } from "./connectivity-badge";

type WorkspaceSidebarProps = {
  lastSyncAt: string | null;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceSidebar({ lastSyncAt }: WorkspaceSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-[calc(100vh-2rem)] w-[290px] flex-col rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[0_18px_50px_rgba(39,26,0,0.07)] lg:flex">
      <div className="flex items-center gap-4 px-1 py-2">
        <div className="flex shrink-0 items-center justify-center text-[color:var(--foreground)]">
          <ContourMark className="size-[63px]" />
        </div>
        <div className="min-w-0 leading-none">
          <p className="truncate text-[20px] font-bold tracking-[-0.05em] text-[color:var(--foreground)]">
            COUNTOUR
          </p>
          <p className="mt-1 text-[11px] font-normal tracking-[0.18em] text-[color:var(--muted)]">
            Analytics Engine
          </p>
        </div>
      </div>

      <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
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

      <div className="mt-4 border-t border-[color:var(--border)] pt-4">
        <div className="flex flex-col gap-3">
          <Link
            href="/activity"
            className="flex items-center justify-between rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[13px] font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface)]"
          >
            <span className="flex items-center gap-2">
              <Workflow className="size-4 text-[color:var(--muted)]" />
              Activity
            </span>
            <ArrowUpRight className="size-3.5 text-[color:var(--muted)]" />
          </Link>
          <ConnectivityBadge lastSyncAt={lastSyncAt} />
        </div>
      </div>

    </aside>
  );
}
