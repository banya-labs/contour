import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["active", "trialing", "past_due", "suspended"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(25),
});

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "agency.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  const { q, status, page, pageSize } = parsed.data;
  const where = {
    ...(status ? { subscriptionStatus: status } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { slug: { contains: q, mode: "insensitive" as const } }] } : {}),
  };
  const [total, organizations] = await Promise.all([
    db.organization.count({ where }),
    db.organization.findMany({
      where,
      select: { id: true, name: true, slug: true, subscriptionTier: true, subscriptionStatus: true, trialEndsAt: true, createdAt: true, _count: { select: { members: true, properties: true, inquiries: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return NextResponse.json({ success: true, agencies: organizations, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}
