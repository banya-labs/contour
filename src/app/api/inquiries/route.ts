import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicInquirySchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limiter";

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting to prevent spam (max 5 inquiries/min)
    const ip = getClientIp(req);
    const limitResult = await checkRateLimit(`inquiry:ip:${ip}`, 5, 60);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many inquiries. Please wait a minute before submitting again." },
        { status: 429, headers: { "Retry-After": limitResult.resetSeconds.toString() } }
      );
    }

    // 2. Parse and validate body
    const body = await req.json();
    const parsed = publicInquirySchema.parse(body);

    // 3. Resolve the organization slug/id
    let organization: any = null;
    try {
      organization = await db.organization.findFirst({
        where: {
          OR: [
            { id: parsed.org },
            { slug: parsed.org }
          ]
        }
      });
    } catch (dbErr: any) {
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        organization = { id: "org_demo_contour", name: "Contour Demo Org" };
      } else {
        throw dbErr;
      }
    }

    if (!organization) {
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        organization = { id: parsed.org || "org_demo_contour", name: "Contour Demo Org" };
      } else {
        return NextResponse.json(
          { success: false, error: "Organization not found." },
          { status: 404 }
        );
      }
    }

    // 4. Resolve the property if provided and find its assigned agent
    let assignedAgentId: string | null = null;
    let enrichedNotes = parsed.notes || "";

    if (parsed.propertyId) {
      try {
        const property = await db.property.findUnique({
          where: { id: parsed.propertyId },
          select: { title: true, assignedAgentId: true }
        });

        if (property) {
          assignedAgentId = property.assignedAgentId;
          const propRefNote = `[Website Inquiry for property: ${property.title} (ID: ${parsed.propertyId})]`;
          enrichedNotes = enrichedNotes ? `${propRefNote}\n${enrichedNotes}` : propRefNote;
        }
      } catch (err: any) {
        console.warn("Failed to lookup property for inquiry:", err.message);
      }
    }

    // 5. Create inquiry in database
    let inquiry: any;
    try {
      inquiry = await db.inquiry.create({
        data: {
          organizationId: organization.id,
          clientName: parsed.clientName,
          clientPhone: parsed.clientPhone,
          clientEmail: parsed.clientEmail || null,
          lookingFor: "FOR_SALE",
          notes: enrichedNotes,
          assignedAgentId: assignedAgentId,
          status: "NEW_INQUIRY",
          // Enforce the 30-day anti-poaching lock
          exclusiveLockExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    } catch (dbErr: any) {
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        console.warn("DB offline or error during inquiry creation, falling back to mock success.", dbErr.message);
        inquiry = {
          id: `inq_${Date.now()}`,
          organizationId: organization.id,
          clientName: parsed.clientName,
          clientPhone: parsed.clientPhone,
          clientEmail: parsed.clientEmail || null,
          notes: enrichedNotes,
          status: "NEW_INQUIRY",
          createdAt: new Date().toISOString(),
        };
      } else {
        throw dbErr;
      }
    }

    // 6. Return response
    return NextResponse.json({
      success: true,
      message: "Inquiry successfully submitted.",
      inquiryId: inquiry.id
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to submit inquiry", details: error.message },
      { status: 500 }
    );
  }
}
