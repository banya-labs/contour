import React from "react";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant-context";
import WorkspaceSidebar from "@/components/workspace-sidebar";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { MobileTopHeader } from "@/components/mobile-top-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const tenant = await getTenantContext(new NextRequest("http://contour.internal/dashboard", { headers: headerList }));
  if (tenant && !tenant.permissions.includes("dashboard.read")) {
    redirect("/agent");
  }
  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-white text-editorial-black font-geist">
      {/* Responsive Sidebar (Icon rail on tablet/landscape, full on desktop, hidden on mobile) */}
      <WorkspaceSidebar />

      {/* Main Workspace Area (padded bottom on mobile to accommodate bottom nav) */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative pb-14 md:pb-0">
        <MobileTopHeader />
        {children}
      </main>

      {/* Native-style Mobile Bottom Navigation Bar (Mobile only) */}
      <MobileBottomNav />
    </div>
  );
}
