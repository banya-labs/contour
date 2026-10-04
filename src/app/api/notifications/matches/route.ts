import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { candidateSelect, inquirySelect, matchingQuerySchema } from "@/lib/matching/service";
import { matchingScope } from "@/lib/matching/api";
import { inquiryVisibility, type MatchingScope } from "@/lib/matching/visibility";
import { buildInquiryMatchingProfile } from "@/lib/matching/inquiry-profile";
import { buildPropertyMatchingCandidate } from "@/lib/matching/property-profile";
import { scorePropertyForInquiry } from "@/lib/matching/score";
import { isQualifyingMatch, TERMINAL_INQUIRY_STATUSES } from "@/lib/matching/policy";
function where(scope: MatchingScope) { return { organizationId: scope.organizationId, inquiry: { ...inquiryVisibility(scope), propertyId: null, status: { notIn: [...TERMINAL_INQUIRY_STATUSES] } }, property: { status: "AVAILABLE" as const } }; }
export const GET = createApiHandler({ requirePermissions: ["pwa.inquiries.read"], querySchema: matchingQuerySchema, handler: async (_req, ctx) => {
  const notifications = await db.propertyMatchNotification.findMany({ where: where(matchingScope(ctx)), include: { property: { select: candidateSelect }, inquiry: { select: inquirySelect } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }] });
  const eligible = notifications.filter((n) => isQualifyingMatch(scorePropertyForInquiry(buildInquiryMatchingProfile(n.inquiry), buildPropertyMatchingCandidate(n.property))));
  const { page, pageSize } = ctx.query;
  return NextResponse.json({ success: true, notifications: eligible.slice((page-1)*pageSize, page*pageSize), unreadCount: eligible.filter((n) => n.status === "UNREAD").length, total: eligible.length, hasMore: page*pageSize < eligible.length });
} });
export const PATCH = createApiHandler({ requirePermissions: ["pwa.inquiries.read"], bodySchema: z.object({ status: z.enum(["READ", "UNREAD"]) }), handler: async (req, ctx) => {
  const scope = matchingScope(ctx), id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Notification ID required" }, { status: 400 });
  const notification = await db.propertyMatchNotification.findFirst({ where: { ...where(scope), id }, include: { property: { select: candidateSelect }, inquiry: { select: inquirySelect } } });
  if (!notification || !isQualifyingMatch(scorePropertyForInquiry(buildInquiryMatchingProfile(notification.inquiry), buildPropertyMatchingCandidate(notification.property)))) return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
  // Shared records do not have per-agent receipts. Only the assigned recipient can mark read.
  if (notification.agentId !== scope.userId) return NextResponse.json({ success: false, error: "Shared matches cannot be marked read for all agents" }, { status: 409 });
  const updated = await db.propertyMatchNotification.update({ where: { id }, data: { status: ctx.body.status, readAt: ctx.body.status === "READ" ? new Date() : null } });
  return NextResponse.json({ success: true, notification: updated });
} });
