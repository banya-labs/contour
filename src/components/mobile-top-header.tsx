"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Smartphone, Settings } from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";
import { authClient } from "@/lib/auth-client";
import { getAgencySettings, formatWorkspaceTitle } from "@/lib/settings/agency-settings";

export function MobileTopHeader() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [workspaceTitle, setWorkspaceTitle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const s = getAgencySettings();
        if (s?.agencyName) return formatWorkspaceTitle(s.agencyName);
      } catch {}
    }
    return "Contour Workspace";
  });

  useEffect(() => {
    const updateTitle = () => {
      try {
        const s = getAgencySettings();
        if (s?.agencyName) setWorkspaceTitle(formatWorkspaceTitle(s.agencyName));
      } catch {}
    };

    updateTitle();

    void fetch("/api/organization/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.organization?.name) {
          setWorkspaceTitle(formatWorkspaceTitle(data.organization.name));
        }
      })
      .catch(() => undefined);

    window.addEventListener("contour_agency_settings_updated", updateTitle);
    window.addEventListener("storage", updateTitle);

    return () => {
      window.removeEventListener("contour_agency_settings_updated", updateTitle);
      window.removeEventListener("storage", updateTitle);
    };
  }, []);

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "C";

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-editorial-border px-3.5 py-2.5 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.03)] shrink-0 select-none">
      {/* Brand & Edition */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-1.5 group" title="Contour Dashboard">
          <ContourLogo size="sm" />
          <span className="font-geist text-[9px] uppercase tracking-wider text-editorial-muted bg-neutral-100 px-1.5 py-0.5 border border-editorial-border font-bold">
            OS 2.0
          </span>
        </Link>
      </div>

      {/* Workspace Indicator & Quick Surface Actions */}
      <div className="flex items-center gap-2">
        <div
          className="max-w-[120px] sm:max-w-[160px] truncate text-[11px] font-heading font-semibold text-editorial-black px-2 py-1 bg-neutral-50 border border-editorial-border"
          title={workspaceTitle}
        >
          {workspaceTitle}
        </div>

        {/* Field Agent PWA switch */}
        <Link
          href="/agent"
          title="Field Agent PWA"
          className="w-8 h-8 flex items-center justify-center border border-editorial-border bg-white text-editorial-black hover:bg-neutral-100 transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5 text-contour-red" />
        </Link>

        {/* User Settings Avatar */}
        <Link
          href="/dashboard/settings"
          title="Agency Settings"
          className="w-8 h-8 flex items-center justify-center bg-editorial-black text-white text-[11px] font-heading font-bold border border-editorial-black hover:bg-contour-red hover:border-contour-red transition-colors"
        >
          {userInitials}
        </Link>
      </div>
    </header>
  );
}
