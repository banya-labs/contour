import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

const updateSchema = z.object({ status: z.enum(["READ", "UNREAD"]) });

export const GET = createApiHandler({
  requirePermissions: ["pwa.access"],
  handler: async (_req, { organizationId, userId }) => {
    const notifications = await db.propertyMatchNotification.findMany({
      where: { organizationId, OR: [{ agentId: userId }, { agentId: null }] },
      include: { property: { select: { id: true, title: true, slug: true, suburb: true, listingType: true, status: true } }, inquiry: { select: { id: true, clientName: true, clientPhone: true, status: true } } },
      orderBy: { createdAt: "desc" }, take: 50,
    });
    return NextResponse.json({ success: true, unreadCount: notifications.filter((item) => item.status === "UNREAD").length, notifications });
  },
});

export const PATCH = createApiHandler({
  requirePermissions: ["pwa.access"], bodySchema: updateSchema,
  handler: async (req, { body, organizationId, userId }) => {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Notification id is required." }, { status: 400 });
    const notification = await db.propertyMatchNotification.findFirst({ where: { id, organizationId, OR: [{ agentId: userId }, { agentId: null }] }, select: { id: true } });
    if (!notification) return NextResponse.json({ success: false, error: "Notification not found." }, { status: 404 });
    const updated = await db.propertyMatchNotification.update({ where: { id }, data: { status: body.status, readAt: body.status === "READ" ? new Date() : null } });
    return NextResponse.json({ success: true, notification: updated });
  },
});
