import React from "react";
import WorkspaceSidebar from "@/components/workspace-sidebar";
import MobileBottomNav from "@/components/mobile-bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-white text-editorial-black font-geist">
      {/* Responsive Sidebar (Icon rail on tablet/landscape, full on desktop, hidden on mobile) */}
      <WorkspaceSidebar />

      {/* Main Workspace Area (padded bottom on mobile to accommodate bottom nav) */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative pb-14 md:pb-0">
        {children}
      </main>

      {/* Native-style Mobile Bottom Navigation Bar (Mobile only) */}
      <MobileBottomNav />
    </div>
  );
}
