import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { roleHasPermission, type ContourRoleKey } from "@/lib/authorization";
import WorkspaceSidebar from "@/components/workspace-sidebar";
import MobileBottomNav from "@/components/mobile-bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });

  if (session?.user) {
    const activeMember = await db.member.findFirst({
      where: { userId: session.user.id, status: "active" },
      include: { roleAssignments: { include: { role: true } } },
    });

    const assignedRoleKey = (activeMember?.roleAssignments[0]?.role.key ||
      (activeMember?.role === "owner" ? "OWNER" : session.user.role || "FIELD_AGENT")) as ContourRoleKey;

    if (!roleHasPermission(assignedRoleKey, "dashboard.read")) {
      redirect("/agent");
    }
  }
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
