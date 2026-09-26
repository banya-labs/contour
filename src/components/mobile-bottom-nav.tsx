"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Menu,
  Home,
  FileText,
  FolderArchive,
  Settings,
  Smartphone,
  LogOut,
  Building,
} from "lucide-react";
import { authClient, contourSignOut } from "@/lib/auth-client";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { getAgencySettings, formatWorkspaceTitle } from "@/lib/settings/agency-settings";
import { ContourLogo } from "@/components/brand/contour-logo";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const permissionForHref = (href: string) => href === "/dashboard" ? "dashboard.read" : href.startsWith("/dashboard/properties") || href.startsWith("/dashboard/map") ? "properties.read" : href.startsWith("/dashboard/sales") || href.startsWith("/dashboard/commissions") ? "finance.read" : href.startsWith("/dashboard/leases") ? "leases.read" : href.startsWith("/dashboard/pipeline") ? "pipeline.read" : href.startsWith("/dashboard/clients") ? "leads.read" : href.startsWith("/dashboard/statements") ? "statements.read" : href.startsWith("/dashboard/billing") ? "org.billing.read" : href.startsWith("/dashboard/documents") ? "vault.read" : "org.read";
  const hasPermission = (href: string) => permissions.includes(permissionForHref(href));

  useEffect(() => {
    void fetch("/api/dashboard/access", { cache: "no-store" }).then((response) => response.json()).then((data) => {
      if (data.success) setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
    }).catch(() => undefined);
  }, []);

  const [workspaceTitle, setWorkspaceTitle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const s = getAgencySettings();
        if (s?.agencyName) return formatWorkspaceTitle(s.agencyName);
      } catch {}
    }
    return "Contour's Workspace";
  });

  useEffect(() => {
    const updateTitle = () => {
      try {
        const s = getAgencySettings();
        if (s?.agencyName) setWorkspaceTitle(formatWorkspaceTitle(s.agencyName));
      } catch {}
    };
    window.addEventListener("contour_agency_settings_updated", updateTitle);
    window.addEventListener("storage", updateTitle);
    return () => {
      window.removeEventListener("contour_agency_settings_updated", updateTitle);
      window.removeEventListener("storage", updateTitle);
    };
  }, []);

  const primaryTabs = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      label: "Pipeline",
      href: "/dashboard/pipeline",
      icon: TrendingUp,
      isActive: pathname.startsWith("/dashboard/pipeline"),
    },
    {
      label: "Clients",
      href: "/dashboard/clients",
      icon: Users,
      isActive: pathname.startsWith("/dashboard/clients"),
    },
  ];

  const moreNavLinks = [
    {
      category: "Assets",
      items: [
        { label: "Properties", href: "/dashboard/properties", icon: Home },
        { label: "Property Sales", href: "/dashboard/sales", icon: Building },
        { label: "Rentals & Leases", href: "/dashboard/leases", icon: FileText },
      ],
    },
    {
      category: "System",
      items: [
        { label: "Documents Vault", href: "/dashboard/documents", icon: FolderArchive },
        { label: "Agency Settings", href: "/dashboard/settings", icon: Settings },
        { label: "Field Agent PWA", href: "/agent", icon: Smartphone },
      ],
    },
  ];

  return (
    <>
      {/* ── Fixed Bottom Navigation Bar (Mobile Only) ── */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-editorial-border md:hidden pb-safe select-none shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
      >
        <div className="grid grid-cols-5 h-14 items-center">
          {primaryTabs.filter((tab) => hasPermission(tab.href)).map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center justify-center h-full py-1 transition-colors ${
                  tab.isActive
                    ? "text-editorial-black font-semibold"
                    : "text-editorial-muted hover:text-editorial-black"
                }`}
              >
                {/* Active indicator bar */}
                {tab.isActive && (
                  <span className="absolute top-0 inset-x-3 h-0.5 bg-contour-red" />
                )}
                <div className="relative">
                  <Icon
                    className={`w-4 h-4 ${
                      tab.isActive
                        ? tab.highlight
                          ? "text-contour-red"
                          : "text-editorial-black"
                        : "text-editorial-muted"
                    }`}
                  />
                  {tab.highlight && !tab.isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-contour-red" />
                  )}
                </div>
                <span className="text-[10px] font-geist mt-1 truncate max-w-[58px]">
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* 5th slot: More Sheet Trigger */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className="relative flex flex-col items-center justify-center h-full py-1 text-editorial-muted hover:text-editorial-black transition-colors"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px] font-geist mt-1">More</span>
          </button>
        </div>
      </nav>

      {/* ── Slide-up "More" Navigation Drawer ── */}
      <BottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title={workspaceTitle}
        subtitle={user?.email || "Workspace Menu"}
      >
        <div className="space-y-4 pb-4 font-geist">
          {/* Contour Brand Stamp */}
          <div className="flex items-center justify-between p-2.5 bg-neutral-50 border border-editorial-border">
            <div className="flex items-center gap-2">
              <ContourLogo size="sm" />
              <span className="font-geist text-[9px] uppercase tracking-wider text-editorial-muted bg-white px-1.5 py-0.5 border border-editorial-border font-bold">
                OS 2.0
              </span>
            </div>
            <span className="text-[10px] font-geist text-editorial-muted">Lusaka Operating HQ</span>
          </div>
          {moreNavLinks.map((group) => (
            <div key={group.category} className="space-y-1">
              <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted px-2 block">
                {group.category}
              </span>
              <div className="grid grid-cols-1 gap-1">
                {group.items.filter((item) => hasPermission(item.href)).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 text-xs transition-colors border ${
                        isActive
                          ? "bg-[#fff5f3] text-editorial-black font-semibold border-contour-red/30"
                          : "text-editorial-black border-transparent hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? "text-contour-red" : "text-editorial-muted"}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 bg-contour-red" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* User Sign Out */}
          <div className="pt-2 border-t border-editorial-border">
            <button
              type="button"
              onClick={() => contourSignOut({ fetchOptions: { onSuccess: () => window.location.assign("/sign-in") } })}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-heading font-semibold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Session</span>
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

export { MobileBottomNav };
