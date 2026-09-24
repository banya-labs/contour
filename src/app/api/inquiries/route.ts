import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicInquirySchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limiter";
import { smartCache } from "@/lib/cache";
import { isPropertyAvailableForNewOpportunity } from "@/lib/property-lifecycle";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting to prevent spam (max 5 inquiries/min)
    const ip = getClientIp(req);
    const limitResult = await checkRateLimit(`inquiry:ip:${ip}`, 5, 60);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many inquiries. Please wait a minute before submitting again." },
        { status: 429, headers: { ...CORS_HEADERS, "Retry-After": limitResult.resetSeconds.toString() } }
      );
    }

    // 2. Parse and validate body
    const body = await req.json();
    const parsed = publicInquirySchema.parse(body);

    // 3. Resolve the organization slug/id
    const organization = await db.organization.findFirst({
      where: {
        OR: [
          { id: parsed.org },
          { slug: parsed.org }
        ]
      }
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found." },
        { status: 404 }
      );
    }

    // 4. Resolve the property if provided and find its assigned agent
    let assignedAgentId: string | null = null;
    let enrichedNotes = parsed.notes || "";

    if (parsed.propertyId) {
      try {
        const property = await db.property.findFirst({
          where: { id: parsed.propertyId, organizationId: organization.id },
          select: { title: true, assignedAgentId: true, status: true }
        });

        if (property) {
          if (!isPropertyAvailableForNewOpportunity(property.status)) {
            return NextResponse.json({ success: false, error: "This property is no longer available and cannot receive new inquiries." }, { status: 409 });
          }
          assignedAgentId = property.assignedAgentId;
          const propRefNote = `[Website Inquiry for property: ${property.title} (ID: ${parsed.propertyId})]`;
          enrichedNotes = enrichedNotes ? `${propRefNote}\n${enrichedNotes}` : propRefNote;
        }
      } catch (err: any) {
        console.warn("Failed to lookup property for inquiry:", err.message);
      }
    }

    // 5. Create inquiry in database
    const inquiry = await db.inquiry.create({
      data: {
        organizationId: organization.id,
        clientName: parsed.clientName,
        clientPhone: parsed.clientPhone,
        clientEmail: parsed.clientEmail || null,
        lookingFor: "FOR_SALE",
        notes: enrichedNotes,
        assignedAgentId,
        propertyId: parsed.propertyId || undefined,
        status: "NEW_INQUIRY",
        // Enforce the 30-day anti-poaching lock
        exclusiveLockExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Invalidate caches across agency dashboard, pipeline, and field agent kiosks
    smartCache.invalidateTag(organization.id, "clients", "/dashboard/clients");
    smartCache.invalidateTag(organization.id, "pipeline", "/dashboard/pipeline");
    smartCache.invalidateTag(organization.id, "dashboard-metrics");
    smartCache.invalidateTag(organization.id, "dashboard-action-queue");
    smartCache.invalidateTag(organization.id, "agent-summary", "/agent");

    // 6. Return response
    return NextResponse.json(
      {
        success: true,
        message: "Inquiry successfully submitted.",
        inquiryId: inquiry.id,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to submit inquiry", details: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
