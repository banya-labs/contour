"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, ShieldCheck } from "lucide-react";
import { contourNavigation } from "@contour/config";
import { ContourMark } from "./contour-mark";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => ({
    Finance: pathname.startsWith("/finance"),
  }));

  useEffect(() => {
    if (pathname.startsWith("/finance")) {
      setExpandedGroups((current) => ({ ...current, Finance: true }));
    }
  }, [pathname]);

  function toggleGroup(label: string) {
    setExpandedGroups((current) => ({
      ...current,
      [label]: !current[label],
    }));
  }

  return (
    <aside className="hidden w-[290px] flex-col rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[0_18px_50px_rgba(39,26,0,0.07)] lg:flex">
      <div className="flex items-center gap-4 px-1 py-2">
        <div className="flex shrink-0 items-center justify-center text-[color:var(--foreground)]">
          <ContourMark className="size-[42px]" />
        </div>
        <div className="min-w-0 leading-none">
          <p className="truncate text-[17px] font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
            Contour
          </p>
          <p className="mt-1 text-[11px] font-normal tracking-[0.18em] text-[color:var(--muted)]">
            Analytics Engine
          </p>
        </div>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-3">
        {contourNavigation.map((section) => (
          <section
            key={section.label}
            className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-3"
          >
            <div className="flex items-center justify-between gap-2 px-2 pb-2">
              {section.href ? (
                <Link
                  href={section.href}
                  className={`text-[10px] uppercase tracking-[0.26em] transition-colors ${
                    isActivePath(pathname, section.href)
                      ? "font-semibold text-[color:var(--foreground)]"
                      : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                  }`}
                >
                  {section.label}
                </Link>
              ) : (
                <p className="text-[10px] uppercase tracking-[0.26em] text-[color:var(--muted)]">
                  {section.label}
                </p>
              )}
              {section.href ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(section.label)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--muted)] transition-colors hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]"
                  aria-label={`Toggle ${section.label} navigation`}
                  aria-expanded={expandedGroups[section.label] ?? false}
                >
                  <ChevronDown
                    className={`size-3.5 transition-transform ${
                      expandedGroups[section.label] ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ) : null}
            </div>
            <div className="space-y-1">
              {(section.href ? expandedGroups[section.label] !== false : true) &&
                section.items.map((item) => {
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-[14px] px-3 py-2 text-[13px] transition-colors ${
                        active
                          ? "bg-[color:rgba(39,26,0,0.08)] font-medium text-[color:var(--foreground)]"
                          : "text-[color:var(--foreground)] hover:bg-[color:var(--surface-muted)]"
                      } ${section.href ? "pl-6" : ""}`}
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

    </aside>
  );
}
