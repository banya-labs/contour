import { NextResponse } from "next/server";
import { z } from "zod";
import { contactSchema } from "@/lib/validations/contact";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { buildContactIdentity, normalizeContactPhone } from "@/lib/crm/contact-identity";


export const GET = createApiHandler({
  requirePermissions: ["leads.read"],
  querySchema: z.object({ search: z.string().trim().max(100).optional() }).partial(),
  handler: async (_req, { organizationId, query }) => {
    const contacts = await db.contact.findMany({
      where: {
        organizationId,
        ...(query.search ? { OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { phone: { contains: query.search } },
          { email: { contains: query.search, mode: "insensitive" } },
        ] } : {}),
      },
      include: { _count: { select: { inquiries: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ success: true, contacts });
  },
});

export const POST = createApiHandler({
  requirePermissions: ["pwa.inquiries.update"],
  bodySchema: contactSchema,
  handler: async (_req, { organizationId, body, userId }) => {
    const phone = normalizeContactPhone(body.phone);
    const identityKey = buildContactIdentity(organizationId!, phone, body.name);
    const existing = await db.contact.findFirst({ where: { organizationId: organizationId!, identityKey }, select: { id: true } });
    if (existing) return NextResponse.json({ success: false, error: "A contact with this phone number already exists." }, { status: 409 });
    const contact = await db.$transaction(async (tx) => {
    const created = await tx.contact.create({
      data: { organizationId: organizationId!, identityKey, name: body.name, phone, email: body.email || null, notes: body.notes || null },
      include: { _count: { select: { inquiries: true } } },
    });
    await tx.auditLog.create({ data: { organizationId: organizationId!, userId, action: "CONTACT_CREATED", entityType: "Contact", entityId: created.id, details: {} } });
    return created;
    });
    return NextResponse.json({ success: true, contact }, { status: 201 });
  },
});
