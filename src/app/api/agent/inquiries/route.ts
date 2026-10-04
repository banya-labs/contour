import { createApiHandler } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { matchingQuerySchema } from "@/lib/matching/service";
import { matchingScope } from "@/lib/matching/api";
import { inquiryVisibility } from "@/lib/matching/visibility";
import { TERMINAL_INQUIRY_STATUSES } from "@/lib/matching/policy";
export const GET = createApiHandler({ requirePermissions: ["pwa.inquiries.read"], querySchema: matchingQuerySchema, handler: async (_req, ctx) => {
  const where = { ...inquiryVisibility(matchingScope(ctx)), status: { notIn: [...TERMINAL_INQUIRY_STATUSES] } };
  const { page, pageSize } = ctx.query;
  const [clients, total] = await Promise.all([db.inquiry.findMany({ where, include: { contact: { select: { id: true, name: true, phone: true, email: true } }, assignedAgent: { select: { id: true, name: true, phone: true } }, property: { select: { id: true, title: true, suburb: true, agencyCommissionPct: true, listingType: true, currency: true, askingPrice: true, rentalPrice: true } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize }), db.inquiry.count({ where })]);
  return NextResponse.json({ success: true, clients, total, page, pageSize, hasMore: page * pageSize < total });
} });
