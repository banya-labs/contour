import { z } from "zod";
import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { matchingScope } from "@/lib/matching/api";
import { visibleContactsWhere } from "@/lib/crm/contact-visibility";
import { inquiryVisibility } from "@/lib/matching/visibility";
export const GET = createApiHandler({ requirePermissions: ["pwa.inquiries.read"], querySchema: z.object({ page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) }), handler: async (_req, ctx) => {
  const scope = matchingScope(ctx);
  const contact = await db.contact.findFirst({ where: { AND: [await visibleContactsWhere(scope), { id: String(ctx.params?.id || "") }] }, include: { inquiries: { where: inquiryVisibility(scope), include: { property: { select: { id: true, title: true, suburb: true } } }, orderBy: { createdAt: "desc" }, skip: (ctx.query.page - 1) * ctx.query.pageSize, take: ctx.query.pageSize } } });
  if (!contact) return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
  const total = await db.inquiry.count({ where: { ...inquiryVisibility(scope), contactId: contact.id } });
  return NextResponse.json({ success: true, contact, inquiries: contact.inquiries, total, hasMore: ctx.query.page * ctx.query.pageSize < total });
} });
