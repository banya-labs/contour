import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { smartCache } from "@/lib/cache";

export const DELETE = createApiHandler({
  requireAuth: true,
  handler: async (_req, { organizationId, userId }) => {
    if (!organizationId || !userId) {
      return NextResponse.json({ success: false, error: "An active organization is required." }, { status: 400 });
    }

    const member = await db.member.findFirst({
      where: { organizationId, userId },
      select: { id: true, role: true },
    });

    if (!member) {
      return NextResponse.json({ success: false, error: "You are not a member of this organization." }, { status: 404 });
    }

    if (member.role === "owner") {
      return NextResponse.json({ success: false, error: "The organization owner cannot leave from the agent profile. Transfer ownership or close the organization first." }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.memberRoleAssignment.deleteMany({ where: { memberId: member.id } });
      await tx.memberPermissionOverride.deleteMany({ where: { memberId: member.id } });
      await tx.member.delete({ where: { id: member.id } });
      await tx.session.updateMany({
        where: { userId, activeOrganizationId: organizationId },
        data: { activeOrganizationId: null, organizationId: null },
      });
    });

    smartCache.invalidateTag(organizationId, "organization-members", "/dashboard/settings");
    smartCache.invalidateTag(organizationId, "dashboard-access", "/dashboard");

    return NextResponse.json({ success: true, message: "Your organization membership has been removed." });
  },
});
