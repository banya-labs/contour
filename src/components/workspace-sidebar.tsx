"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  MapPin,
  TrendingUp,
  KeyRound,
  DollarSign,
  FileSpreadsheet,
  Users,
  Building2,
  Settings,
  LogOut,
  FolderLock,
  Landmark,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon?: any;
  highlight?: boolean;
};

type NavGroup = {
  name: string;
  icon: any;
  items: NavItem[];
  defaultOpen?: boolean;
};

export default function WorkspaceSidebar() {
  const pathname = usePathname();

  // Track expanded submenu states
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Properties: true,
    "CRM & Deals": true,
    Finance: true,
  });

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const navGroups: NavGroup[] = [
    {
      name: "Properties",
      icon: Home,
      items: [
        { name: "Catalog & Vault", href: "/dashboard/properties" },
        { name: "Live Map Hub", href: "/dashboard/map", highlight: true },
        { name: "Property Sales", href: "/dashboard/sales" },
        { name: "Rentals & Leases", href: "/dashboard/leases" },
      ],
    },
    {
      name: "CRM & Deals",
      icon: Users,
      items: [
        { name: "Deal Pipeline", href: "/dashboard/pipeline" },
        { name: "Client CRM", href: "/dashboard/clients" },
      ],
    },
    {
      name: "Finance",
      icon: DollarSign,
      items: [
        { name: "Commissions Ledger", href: "/dashboard/commissions" },
        { name: "Landlord Statements", href: "/dashboard/statements" },
      ],
    },
  ];

  const isOverviewActive = pathname === "/dashboard";
  const isDocumentsActive = pathname.startsWith("/dashboard/documents");

  return (
    <aside className="w-64 bg-paper-100 border-r border-border h-screen max-h-screen sticky top-0 flex flex-col justify-between p-4 shrink-0 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 py-3 mb-4 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-contour-red flex items-center justify-center text-white shadow-subtle font-serif font-bold text-lg">
            C
          </div>
          <div>
            <div className="font-serif font-bold text-base text-ink-900 tracking-tight leading-none">
              CONTOUR
            </div>
            <div className="text-[10px] text-ink-600 font-medium tracking-wider uppercase mt-0.5">
              Real Estate OS
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-3 flex-1 overflow-y-auto pr-1">
          {/* 1. Direct Overview Link */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isOverviewActive
                ? "bg-ink-900 text-white shadow-subtle"
                : "text-ink-800 hover:bg-paper-200"
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${isOverviewActive ? "text-white" : "text-ink-600"}`} />
            <span>Overview</span>
          </Link>

          {/* 2. Structured Submenu Groups */}
          {navGroups.map((group) => {
            const isOpen = openGroups[group.name];
            const isAnyChildActive = group.items.some(
              (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            );
            const Icon = group.icon;

            return (
              <div key={group.name} className="space-y-1">
                {/* Group Header Button */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    isAnyChildActive ? "text-contour-red font-bold" : "text-ink-700 hover:text-ink-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isAnyChildActive ? "text-contour-red" : "text-ink-500"}`} />
                    <span className="tracking-tight">{group.name}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-ink-400" />
                  )}
                </button>

                {/* Submenu Child Items */}
                {isOpen && (
                  <div className="pl-4 space-y-0.5 border-l border-paper-300 ml-3.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-ink-900 text-white shadow-subtle font-semibold"
                              : item.highlight
                              ? "text-contour-red hover:bg-paper-200/80 font-semibold"
                              : "text-ink-700 hover:bg-paper-200/60 hover:text-ink-900"
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {item.highlight && !isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-contour-red" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* 3. Direct Documents Vault Link */}
          <Link
            href="/dashboard/documents"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isDocumentsActive
                ? "bg-ink-900 text-white shadow-subtle font-semibold"
                : "text-ink-800 hover:bg-paper-200"
            }`}
          >
            <FolderLock className={`w-4 h-4 ${isDocumentsActive ? "text-white" : "text-ink-600"}`} />
            <span>Documents Vault</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Profile / Quick Surface Switches */}
      <div className="space-y-2 pt-4 border-t border-paper-300">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
            pathname === "/dashboard/settings"
              ? "bg-ink-900 text-white font-semibold"
              : "text-ink-800 hover:bg-paper-200"
          }`}
        >
          <Settings className="w-4 h-4 text-ink-600" />
          <span>Agency Settings</span>
        </Link>
        <Link
          href="/agent"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-ink-800 hover:bg-paper-200 rounded-xl transition-colors"
        >
          <Smartphone className="w-4 h-4 text-ink-600" />
          <span>Field Agent PWA</span>
        </Link>
        <Link
          href="/admin"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-ink-800 hover:bg-paper-200 rounded-xl transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-ink-600" />
          <span>Admin Mission Control</span>
        </Link>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-paper-200/60 mt-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-ink-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
              G
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-ink-900 truncate">
                Grace Banda
              </div>
              <div className="text-[10px] text-ink-600 truncate">
                Principal Broker
              </div>
            </div>
          </div>
          <Link href="/login" title="Sign Out" className="text-ink-600 hover:text-contour-red p-1">
            <LogOut className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
