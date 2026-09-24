import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";

const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(20) });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "audit.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
  const { page, pageSize } = parsed.data;
  const [total, entries] = await Promise.all([
    db.auditLog.count({ where: { organizationId: id } }),
    db.auditLog.findMany({ where: { organizationId: id }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, action: true, entityType: true, entityId: true, details: true, createdAt: true, user: { select: { name: true, email: true } } } }),
  ]);
  return NextResponse.json({ success: true, activity: entries.map((entry) => ({ ...entry, actor: entry.user?.name || entry.user?.email || "System" })), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}
