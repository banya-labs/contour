import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { z } from "zod";
import { matchingQuerySchema } from "@/lib/matching/service";
import { matchingScope } from "@/lib/matching/api";
import { visibleContactsWhere } from "@/lib/crm/contact-visibility";
import { inquiryVisibility } from "@/lib/matching/visibility";
export const GET = createApiHandler({ requirePermissions: ["pwa.inquiries.read"], querySchema: matchingQuerySchema.extend({ search: z.string().trim().max(100).optional() }), handler: async (_req, ctx) => {
  const scope = matchingScope(ctx), visibility = await visibleContactsWhere(scope);
  const where = { AND: [visibility, ...(ctx.query.search ? [{ OR: [{ name: { contains: ctx.query.search, mode: "insensitive" as const } }, { phone: { contains: ctx.query.search } }] }] : [])] };
  const { page, pageSize } = ctx.query;
  const [contacts, total] = await Promise.all([db.contact.findMany({ where, select: { id: true, name: true, phone: true, email: true, _count: { select: { inquiries: { where: inquiryVisibility(scope) } } } }, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize }), db.contact.count({ where })]);
  return NextResponse.json({ success: true, contacts, total, page, pageSize, hasMore: page * pageSize < total });
} });
