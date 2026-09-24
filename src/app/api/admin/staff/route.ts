import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole, PLATFORM_ROLES } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";

const mutationSchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().min(1).optional(),
  role: z.enum(PLATFORM_ROLES).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  reason: z.string().trim().min(8).max(500),
}).refine((value) => Boolean(value.userId || value.email), { message: "userId or email is required" });

async function actorFor(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  if (!session?.user) return null;
  return getPlatformActor(session.user.id, session.user.email);
}

export async function GET(request: NextRequest) {
  const actor = await actorFor(request);
  if (!actor || !canPlatformRole(actor.role, "staff.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const staff = await db.platformStaff.findMany({
    include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ success: true, staff });
}

export async function POST(request: NextRequest) {
  return mutate(request, "create");
}

export async function PATCH(request: NextRequest) {
  return mutate(request, "update");
}

async function mutate(request: NextRequest, operation: "create" | "update") {
  const actor = await actorFor(request);
  if (!actor || !canPlatformRole(actor.role, "staff.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const targetUser = input.userId
    ? await db.user.findUnique({ where: { id: input.userId }, select: { id: true, email: true } })
    : await db.user.findUnique({ where: { email: input.email!.trim().toLowerCase() }, select: { id: true, email: true } });
  if (!targetUser) return NextResponse.json({ error: "Contour user not found. Create their account first." }, { status: 404 });
  if (targetUser.id === actor.userId) return NextResponse.json({ error: "You cannot change your own platform access." }, { status: 400 });
  if (input.role === "OWNER" && actor.role !== "OWNER") return NextResponse.json({ error: "Only a platform owner can grant owner access." }, { status: 403 });

  const existing = await db.platformStaff.findUnique({ where: { userId: targetUser.id } });
  if (operation === "create" && existing) return NextResponse.json({ error: "User is already platform staff." }, { status: 409 });
  if (operation === "update" && !existing) return NextResponse.json({ error: "Platform staff record not found." }, { status: 404 });
  const result = operation === "create"
    ? await db.platformStaff.create({ data: { userId: targetUser.id, role: input.role || "READ_ONLY" } })
    : await db.platformStaff.update({ where: { userId: targetUser.id }, data: { ...(input.role ? { role: input.role } : {}), ...(input.status ? { status: input.status, suspendedAt: input.status === "SUSPENDED" ? new Date() : null } : {}) } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "PlatformStaff", targetId: result.id, capability: operation === "create" ? "staff.create" : "staff.update", reason: input.reason, details: { targetUserId: targetUser.id, role: result.role, status: result.status } } });
  return NextResponse.json({ success: true, staff: result });
}
