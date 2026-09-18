"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Smartphone, Settings, Download, Building2, LogOut } from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";
import { authClient, contourSignOut } from "@/lib/auth-client";
import { getAgencySettings, formatWorkspaceTitle } from "@/lib/settings/agency-settings";
import { triggerPwaInstallModal } from "@/components/pwa/pwa-install-banner";

export function MobileTopHeader() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "C";

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-editorial-border px-4 py-2.5 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.03)] shrink-0 select-none">
      {/* Brand Logo Only (Minimal) */}
      <div className="flex items-center">
        <Link href="/dashboard" className="flex items-center group" title="Contour Dashboard">
          <ContourLogo size="sm" />
        </Link>
      </div>

      {/* User Icon & Dropdown Menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          title="User & Workspace Menu"
          aria-label="User & Workspace Menu"
          aria-expanded={dropdownOpen}
          className="w-8 h-8 flex items-center justify-center bg-editorial-black text-white text-[11px] font-heading font-bold border border-editorial-black hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {userInitials}
        </button>

        {/* Dropdown Menu Drawer */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white border border-editorial-border shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* User & Workspace Identity Header */}
            <div className="p-3 bg-neutral-50/80 border-b border-editorial-border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-editorial-black text-white flex items-center justify-center text-xs font-bold font-heading shrink-0 border border-editorial-black">
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-heading font-bold text-editorial-black truncate">
                      {user?.name || "Authenticated Agent"}
                    </div>
                    <div className="text-[10px] font-geist text-editorial-muted truncate">
                      {user?.email || "Agent"}
                    </div>
                  </div>
                </div>

                {/* OS Version Badge */}
                <span className="shrink-0 font-geist text-[9px] uppercase tracking-wider text-editorial-muted bg-white px-1.5 py-0.5 border border-editorial-border font-bold">
                  OS 2.0
                </span>
              </div>

              {/* Workspace Indicator */}
              <div className="mt-2.5 pt-2 border-t border-editorial-border/60 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-editorial-muted shrink-0" />
                <span className="text-[11px] font-heading font-semibold text-editorial-black truncate" title={workspaceTitle}>
                  {workspaceTitle}
                </span>
              </div>
            </div>

            {/* Action Items */}
            <div className="py-1 divide-y divide-editorial-border/40">
              {/* Field Agent PWA Switch */}
              <Link
                href="/agent"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-heading text-editorial-black hover:bg-neutral-50 transition-colors"
              >
                <Smartphone className="w-4 h-4 text-contour-red shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span>Field Agent PWA</span>
                  <span className="text-[9px] font-geist uppercase text-contour-red bg-red-50 border border-red-200 px-1 py-0.5 font-semibold">
                    Field
                  </span>
                </div>
              </Link>

              {/* Install Contour App */}
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  triggerPwaInstallModal();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-heading text-editorial-black hover:bg-neutral-50 transition-colors text-left cursor-pointer"
              >
                <Download className="w-4 h-4 text-contour-red shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span>Install Contour App</span>
                  <span className="text-[9px] font-geist text-editorial-muted">PWA</span>
                </div>
              </button>

              {/* Agency Settings */}
              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-heading text-editorial-black hover:bg-neutral-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-editorial-muted shrink-0" />
                <span>Agency Settings</span>
              </Link>

              {/* Sign Out */}
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  contourSignOut({
                    fetchOptions: {
                      onSuccess: () => window.location.assign("/sign-in"),
                    },
                  });
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-heading text-red-600 hover:bg-red-50/50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
