"use client";

import { usePathname } from "next/navigation";
import { PageTabs } from "@/components/ui/page-tabs";

const tabs = [
  { id: "overview", label: "Overview", href: "/admin" },
  { id: "agencies", label: "Agencies", href: "/admin/agencies" },
  { id: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions" },
  { id: "offers", label: "Offers", href: "/admin/offers" },
  { id: "staff", label: "Staff", href: "/admin/staff" },
  { id: "mcp", label: "MCP Studio", href: "/admin/mcp" },
];

export function ControlPlaneTabs() {
  const pathname = usePathname();
  const activeTab = pathname === "/admin"
    ? "overview"
    : tabs.find((tab) => tab.id !== "overview" && pathname.startsWith(tab.href))?.id || "overview";

  return <PageTabs tabs={tabs} activeTab={activeTab} />;
}

