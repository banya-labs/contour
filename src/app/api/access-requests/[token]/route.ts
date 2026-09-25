import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { toAuthHeaders } from "@/lib/auth-headers";
import { db } from "@/lib/db";
import { hashAccessToken } from "@/lib/access-request";
import { CONTOUR_ROLE_KEYS } from "@/lib/authorization";

const requestSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  roleKey: z.enum(CONTOUR_ROLE_KEYS.filter((key) => key !== "OWNER") as [string, ...string[]]).default("FIELD_AGENT"),
});

async function getLink(token: string) {
  return db.accessRequestLink.findFirst({
    where: { tokenHash: hashAccessToken(token), revokedAt: null },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  });
}

export async function GET(_req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const link = await getLink(token);
  if (!link) return NextResponse.json({ success: false, error: "This access link is invalid or has been revoked." }, { status: 404 });
  return NextResponse.json({ success: true, organization: link.organization });
}

export async function POST(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const link = await getLink(token);
  if (!link) return NextResponse.json({ success: false, error: "This access link is invalid or has been revoked." }, { status: 404 });

  const session = await auth.api.getSession({ headers: toAuthHeaders(req.headers) });
  if (!session?.user.id) return NextResponse.json({ success: false, error: "Create an account or sign in before requesting access." }, { status: 401 });
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "First name and last name are required.", details: parsed.error.format() }, { status: 400 });

  const existingMember = await db.member.findUnique({ where: { organizationId_userId: { organizationId: link.organizationId, userId: session.user.id } } });
  if (existingMember?.status === "active") return NextResponse.json({ success: false, error: "You already have access to this workspace." }, { status: 409 });

  const existing = await db.accessRequest.findUnique({ where: { organizationId_userId: { organizationId: link.organizationId, userId: session.user.id } } });
  if (existing?.status === "PENDING") return NextResponse.json({ success: true, status: "PENDING" });
  const request = await db.accessRequest.upsert({
    where: { organizationId_userId: { organizationId: link.organizationId, userId: session.user.id } },
    create: { organizationId: link.organizationId, userId: session.user.id, firstName: parsed.data.firstName, lastName: parsed.data.lastName, email: session.user.email, roleKey: parsed.data.roleKey },
    update: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, email: session.user.email, roleKey: parsed.data.roleKey, status: "PENDING", reviewedById: null, reviewedAt: null, declineReason: null },
  });
  await db.user.update({ where: { id: session.user.id }, data: { name: `${parsed.data.firstName} ${parsed.data.lastName}` } });
  return NextResponse.json({ success: true, status: request.status });
}
