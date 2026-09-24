import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = createApiHandler({
  requirePermissions: ["leads.read"],
  handler: async (_req, { organizationId, params }) => {
    const id = params?.id;
    const contact = await db.contact.findFirst({ where: { id: typeof id === "string" ? id : "", organizationId: organizationId! }, include: { inquiries: { include: { property: { select: { id: true, title: true, suburb: true } } }, orderBy: { createdAt: "desc" } } } });
    if (!contact) return NextResponse.json({ success: false, error: "Contact not found." }, { status: 404 });
    return NextResponse.json({ success: true, contact });
  },
});

export const PATCH = createApiHandler({
  requirePermissions: ["pwa.inquiries.update"],
  bodySchema: z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().min(6).max(30), email: z.string().email().optional().or(z.literal("")), notes: z.string().trim().max(1000).optional() }),
  handler: async (_req, { organizationId, params, body }) => {
    const id = params?.id;
    if (typeof id !== "string") return NextResponse.json({ success: false, error: "Contact id is required." }, { status: 400 });
    const existing = await db.contact.findFirst({ where: { id, organizationId: organizationId! }, select: { id: true } });
    if (!existing) return NextResponse.json({ success: false, error: "Contact not found." }, { status: 404 });
    const contact = await db.contact.update({ where: { id }, data: { name: body.name, phone: body.phone, email: body.email || null, notes: body.notes || null } });
    return NextResponse.json({ success: true, contact });
  },
});
