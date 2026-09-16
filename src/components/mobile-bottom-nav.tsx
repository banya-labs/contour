"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Users,
  Menu,
  Home,
  FileText,
  DollarSign,
  FolderArchive,
  Settings,
  Smartphone,
  ShieldCheck,
  LogOut,
  Building,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { getAgencySettings, formatWorkspaceTitle } from "@/lib/settings/agency-settings";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const user = session?.user;

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
      label: "Map Hub",
      href: "/dashboard/map",
      icon: MapPin,
      isActive: pathname.startsWith("/dashboard/map"),
      highlight: true,
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
      category: "Properties",
      items: [
        { label: "Catalog & Vault", href: "/dashboard/properties", icon: Home },
        { label: "Property Sales", href: "/dashboard/sales", icon: Building },
        { label: "Rentals & Leases", href: "/dashboard/leases", icon: FileText },
      ],
    },
    {
      category: "Finance",
      items: [
        { label: "Commissions Ledger", href: "/dashboard/commissions", icon: DollarSign },
        { label: "Landlord Statements", href: "/dashboard/statements", icon: FileText },
        { label: "Subscription & Billing", href: "/dashboard/billing", icon: DollarSign },
      ],
    },
    {
      category: "System",
      items: [
        { label: "Documents Vault", href: "/dashboard/documents", icon: FolderArchive },
        { label: "Agency Settings", href: "/dashboard/settings", icon: Settings },
        { label: "Field Agent PWA", href: "/agent", icon: Smartphone },
        { label: "Admin Control", href: "/admin", icon: ShieldCheck },
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
          {primaryTabs.map((tab) => {
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
        <div className="space-y-5 pb-4 font-geist">
          {moreNavLinks.map((group) => (
            <div key={group.category} className="space-y-1">
              <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted px-2 block">
                {group.category}
              </span>
              <div className="grid grid-cols-1 gap-1">
                {group.items.map((item) => {
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
              onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => window.location.assign("/sign-in") } })}
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
