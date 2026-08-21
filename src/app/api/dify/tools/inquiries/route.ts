import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDifyRequest } from "@/lib/dify-auth";

/**
 * Dify Tool: `create_inquiry_or_lead`
 * 
 * Ingests a new buyer or tenant inquiry from Dify (e.g. WhatsApp conversation)
 * directly into Neon PostgreSQL with a 30-day anti-poaching lock.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      organization_id,
      clientName,
      clientPhone,
      clientEmail,
      lookingFor = "FOR_SALE",
      propertyType,
      budgetMin,
      budgetMax,
      currency = "ZMW",
      preferredSuburbs = [],
      notes,
    } = body;

    if (!clientName || !clientPhone) {
      return NextResponse.json(
        { error: "Client name and phone number are required to create an inquiry." },
        { status: 400 }
      );
    }

    const { context, errorResponse } = await authenticateDifyRequest(req, organization_id);
    if (errorResponse) return errorResponse;

    const tenantOrgId = context!.organizationId;

    // Calculate 30-Day Anti-Poaching Lock
    const antiPoachingExpiry = new Date();
    antiPoachingExpiry.setDate(antiPoachingExpiry.getDate() + 30);

    let createdInquiry: any = null;

    try {
      createdInquiry = await db.inquiry.create({
        data: {
          organizationId: tenantOrgId,
          clientName,
          clientPhone,
          clientEmail: clientEmail || null,
          lookingFor: ["FOR_SALE", "FOR_RENT"].includes(lookingFor) ? lookingFor : "FOR_SALE",
          propertyType: propertyType || null,
          budgetMin: budgetMin ? Number(budgetMin) : null,
          budgetMax: budgetMax ? Number(budgetMax) : null,
          currency: ["ZMW", "USD", "ZAR"].includes(currency) ? currency : "ZMW",
          preferredSuburbs: Array.isArray(preferredSuburbs) ? preferredSuburbs : [preferredSuburbs],
          notes: notes ? `[Dify Agent Capture] ${notes}` : "[Dify Agent Capture] Lead recorded via AI conversation",
          exclusiveLockExpiresAt: antiPoachingExpiry,
          status: "NEW_INQUIRY",
        },
      });
    } catch (dbError) {
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        createdInquiry = {
          id: `inq_${Date.now()}`,
          organizationId: tenantOrgId,
          clientName,
          clientPhone,
          lookingFor,
          budgetMax,
          currency,
          preferredSuburbs,
          exclusiveLockExpiresAt: antiPoachingExpiry,
          status: "NEW_INQUIRY",
        };
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({
      success: true,
      tenant: tenantOrgId,
      message: "Lead successfully recorded with 30-Day Anti-Poaching Lock.",
      inquiry: {
        id: createdInquiry.id,
        clientName: createdInquiry.clientName,
        clientPhone: createdInquiry.clientPhone,
        preferredSuburbs: createdInquiry.preferredSuburbs,
        antiPoachingLockExpiry: antiPoachingExpiry.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Dify Inquiry Ingestion Tool Error:", error);
    return NextResponse.json(
      { error: "Failed to create inquiry in database", details: error.message },
      { status: 500 }
    );
  }
}
