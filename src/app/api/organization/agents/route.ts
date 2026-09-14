import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["leads.read"],
  handler: async (_req, { organizationId, session }) => {
    let members = await db.member.findMany({
      where: {
        organizationId: organizationId!,
        status: "active",
        OR: [
          { user: { role: { in: ["SUPER_ADMIN", "BROKER_MANAGER", "FIELD_AGENT"] } } },
          { roleAssignments: { some: { role: { permissions: { some: { permission: { in: ["leads.assign", "pwa.inquiries.update"] } } } } } } },
        ],
      },
      select: {
        id: true,
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        roleAssignments: { select: { role: { select: { key: true } } } },
      },
      orderBy: { user: { name: "asc" } },
    });

    if (members.length === 0) {
      members = await db.member.findMany({
        where: {
          organizationId: organizationId!,
          status: "active",
        },
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true, phone: true, role: true } },
          roleAssignments: { select: { role: { select: { key: true } } } },
        },
        orderBy: { user: { name: "asc" } },
      });
    }

    if (members.length === 0 && session?.user) {
      return NextResponse.json({
        success: true,
        agents: [
          {
            id: session.user.id,
            memberId: "current_user",
            name: session.user.name || "Active Agent",
            email: session.user.email,
            phone: (session.user as any).phone || null,
            roleKey: (session.user as any).role || "FIELD_AGENT",
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      agents: members.map((member) => ({
        id: member.user.id,
        memberId: member.id,
        name: member.user.name,
        email: member.user.email,
        phone: member.user.phone,
        roleKey: member.roleAssignments[0]?.role.key || member.user.role,
      })),
    });
  },
});
