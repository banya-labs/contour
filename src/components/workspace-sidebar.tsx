"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useUser,
  useOrganization,
  OrganizationSwitcher,
  SignOutButton,
} from "@clerk/nextjs";
import {
  LayoutDashboard,
  Home,
  Users,
  DollarSign,
  Settings,
  LogOut,
  FolderArchive,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Building,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  highlight?: boolean;
  adminOnly?: boolean;
};

type NavGroup = {
  name: string;
  icon: any;
  items: NavItem[];
};

export default function WorkspaceSidebar() {
  const pathname = usePathname();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization();

  // Determine user role in current active agency organization
  const role = membership?.role;
  const isPrincipalBroker = !role || role === "org:admin";
  const roleLabel =
    role === "org:admin"
      ? "Principal Broker"
      : role === "org:manager"
      ? "Branch Manager"
      : "Field Agent";

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
        {
          name: "Subscription & Billing",
          href: "/dashboard/billing",
          adminOnly: true,
        },
      ],
    },
  ];

  const isOverviewActive = pathname === "/dashboard";
  const isDocumentsActive = pathname.startsWith("/dashboard/documents");

  // User initials for monogram avatar fallback
  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.firstName
      ? user.firstName[0].toUpperCase()
      : user?.primaryEmailAddress?.emailAddress
      ? user.primaryEmailAddress.emailAddress[0].toUpperCase()
      : "C";

  return (
    <aside className="hidden md:flex md:w-16 lg:w-64 bg-white border-r border-editorial-border h-screen max-h-screen sticky top-0 flex-col justify-between p-2 lg:p-3 shrink-0 font-geist select-none overflow-hidden transition-all duration-200">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Brand & Organization Switcher Header */}
        <div className="border-b border-editorial-border pb-2 lg:pb-3 mb-2 lg:mb-3 shrink-0">
          <div className="flex items-center justify-center lg:justify-between mb-2">
            <Link href="/" className="flex items-center gap-2 group" title="Contour Real Estate OS">
              <span className="w-6 h-6 lg:w-5 lg:h-5 bg-editorial-black text-white flex items-center justify-center font-heading font-bold text-xs tracking-tighter">
                C
              </span>
              <span className="hidden lg:inline font-heading font-bold text-sm tracking-tight text-editorial-black group-hover:text-contour-red transition-colors">
                CONTOUR
              </span>
            </Link>
            <span className="hidden lg:inline-block font-geist text-[9px] uppercase tracking-wider text-editorial-muted bg-neutral-100 px-1.5 py-0.5 border border-editorial-border">
              OS 2.0
            </span>
          </div>

          {/* Real Estate Multi-Tenant Organization Switcher (Full on Desktop) */}
          <div className="hidden lg:block w-full">
            <OrganizationSwitcher
              hidePersonal={false}
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              afterLeaveOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationSwitcherTrigger:
                    "w-full rounded-none border border-editorial-border bg-neutral-50/50 hover:bg-neutral-100/60 px-2.5 py-1.5 text-xs font-heading font-semibold text-editorial-black flex items-center justify-between transition-colors shadow-none",
                },
              }}
            />
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-2 lg:space-y-3 flex-1 overflow-y-auto no-scrollbar pr-0 lg:pr-1">
          {/* 1. Direct Overview Link */}
          <Link
            href="/dashboard"
            title="Overview"
            className={`flex items-center justify-center lg:justify-between px-2 lg:px-3 py-2 text-xs font-heading font-medium transition-colors border ${
              isOverviewActive
                ? "bg-editorial-black text-white border-editorial-black font-semibold"
                : "text-editorial-black border-transparent hover:border-editorial-border hover:bg-neutral-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard
                className={`w-4 h-4 lg:w-3.5 lg:h-3.5 ${isOverviewActive ? "text-white" : "text-editorial-muted"}`}
              />
              <span className="hidden lg:inline">Overview</span>
            </div>
            {isOverviewActive && (
              <span className="hidden lg:inline-block w-1.5 h-1.5 bg-contour-red" />
            )}
          </Link>

          {/* 2. Structured Submenu Groups */}
          {navGroups.map((group) => {
            const isOpen = openGroups[group.name];
            const isAnyChildActive = group.items.some(
              (item) =>
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
            );
            const Icon = group.icon;

            return (
              <div key={group.name} className="space-y-1">
                {/* Group Header Button */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  title={group.name}
                  className="w-full flex items-center justify-center lg:justify-between px-1.5 lg:px-2 py-1.5 text-[11px] font-heading font-semibold uppercase tracking-wider text-editorial-muted hover:text-editorial-black transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 lg:w-3 lg:h-3 text-editorial-muted shrink-0" />
                    <span className="hidden lg:inline">{group.name}</span>
                  </div>
                  <div className="hidden lg:block">
                    {isOpen ? (
                      <ChevronDown className="w-3 h-3 text-editorial-muted" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-editorial-muted" />
                    )}
                  </div>
                </button>

                {/* Submenu Child Items */}
                {isOpen && (
                  <div className="space-y-0.5 border-l-0 lg:border-l border-editorial-border ml-0 lg:ml-3 pl-0 lg:pl-2">
                    {group.items.map((item) => {
                      if (item.adminOnly && !isPrincipalBroker) return null;

                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" &&
                          pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={item.name}
                          className={`flex items-center justify-center lg:justify-between px-1.5 lg:px-2.5 py-1.5 text-xs transition-all ${
                            isActive
                              ? "bg-[#fff5f3] text-editorial-black font-semibold border-l-2 border-contour-red lg:-ml-[9px] lg:pl-[9px]"
                              : item.highlight
                              ? "text-editorial-black hover:bg-neutral-50 hover:text-contour-red font-medium"
                              : "text-editorial-muted hover:text-editorial-black hover:bg-neutral-50"
                          }`}
                        >
                          <span className="hidden lg:inline truncate">{item.name}</span>
                          <span className="lg:hidden text-[9px] font-mono font-bold uppercase">{item.name.slice(0, 3)}</span>
                          {item.highlight && !isActive && (
                            <span className="hidden lg:inline-block w-1.5 h-1.5 rounded-full bg-contour-red" />
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
            title="Documents Vault"
            className={`flex items-center justify-center lg:justify-between px-2 lg:px-3 py-2 text-xs font-heading font-medium transition-colors border ${
              isDocumentsActive
                ? "bg-editorial-black text-white border-editorial-black font-semibold"
                : "text-editorial-black border-transparent hover:border-editorial-border hover:bg-neutral-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FolderArchive
                className={`w-4 h-4 lg:w-3.5 lg:h-3.5 ${isDocumentsActive ? "text-white" : "text-editorial-muted"}`}
              />
              <span className="hidden lg:inline">Documents Vault</span>
            </div>
            {isDocumentsActive && <span className="hidden lg:inline-block w-1.5 h-1.5 bg-contour-red" />}
          </Link>
        </nav>
      </div>

      {/* Bottom Profile / Surface Switches */}
      <div className="space-y-1 pt-2 lg:pt-3 border-t border-editorial-border shrink-0">
        <Link
          href="/dashboard/settings"
          title="Agency Settings"
          className={`flex items-center justify-center lg:justify-start gap-2 px-2 lg:px-2.5 py-1.5 text-xs font-heading font-medium transition-colors ${
            pathname === "/dashboard/settings"
              ? "bg-editorial-black text-white font-semibold"
              : "text-editorial-black hover:bg-neutral-50"
          }`}
        >
          <Settings className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-editorial-muted shrink-0" />
          <span className="hidden lg:inline">Agency Settings</span>
        </Link>
        <Link
          href="/agent"
          title="Field Agent PWA"
          className="flex items-center justify-center lg:justify-start gap-2 px-2 lg:px-2.5 py-1.5 text-xs font-heading font-medium text-editorial-black hover:bg-neutral-50 transition-colors"
        >
          <Smartphone className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-editorial-muted shrink-0" />
          <span className="hidden lg:inline">Field Agent PWA</span>
        </Link>
        <Link
          href="/admin"
          title="Admin Control"
          className="flex items-center justify-center lg:justify-start gap-2 px-2 lg:px-2.5 py-1.5 text-xs font-heading font-medium text-editorial-black hover:bg-neutral-50 transition-colors"
        >
          <ShieldCheck className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-editorial-muted shrink-0" />
          <span className="hidden lg:inline">Admin Control</span>
        </Link>

        {/* Live Clerk User Profile Card */}
        <div className="flex items-center justify-center lg:justify-between p-1.5 lg:p-2 border border-editorial-border bg-neutral-50/70 mt-1">
          <Link
            href="/dashboard/settings?tab=account"
            className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            title="View Account Profile"
          >
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName || "User"}
                className="w-7 h-7 object-cover border border-editorial-border shrink-0"
              />
            ) : (
              <div className="w-7 h-7 bg-editorial-black text-white flex items-center justify-center text-xs font-bold shrink-0 font-heading">
                {userInitials}
              </div>
            )}
            <div className="hidden lg:block min-w-0 flex-1">
              <div className="text-xs font-heading font-bold text-editorial-black truncate leading-tight">
                {isUserLoaded ? user?.fullName || user?.username || "Authenticated Agent" : "Loading..."}
              </div>
              <div className="text-[10px] font-geist text-editorial-muted truncate">
                {roleLabel}
              </div>
            </div>
          </Link>
          <div className="hidden lg:block">
            <SignOutButton redirectUrl="/sign-in">
              <button
                type="button"
                title="Sign Out"
                className="text-editorial-muted hover:text-contour-red p-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </aside>
  );
}
