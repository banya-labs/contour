import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDifyRequest } from "@/lib/dify-auth";
import { inquiryToolSchema } from "@/lib/ai-tool-schemas";
import { getOrCreateCorrelationId } from "@/lib/correlation";
import { getOrCreateContact } from "@/lib/crm/contact-service";

/**
 * Dify Tool: `create_inquiry_or_lead`
 * 
 * Ingests a new buyer or tenant inquiry from Dify (e.g. WhatsApp conversation)
 * directly into Neon PostgreSQL with a 30-day anti-poaching lock.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = inquiryToolSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid inquiry arguments" }, { status: 400 });
    }
    const { organization_id, clientName, clientPhone, clientEmail, lookingFor, propertyType, budgetMin, budgetMax, currency, preferredSuburbs, notes } = parsed.data;

    const { context, errorResponse } = await authenticateDifyRequest(req, organization_id);
    if (errorResponse) return errorResponse;

    const tenantOrgId = context!.organizationId;
    const contact = await getOrCreateContact(db, { organizationId: tenantOrgId, name: clientName, phone: clientPhone, email: clientEmail });

    // Calculate 30-Day Anti-Poaching Lock
    const antiPoachingExpiry = new Date();
    antiPoachingExpiry.setDate(antiPoachingExpiry.getDate() + 30);

    const createdInquiry = await db.inquiry.create({
        data: {
          organizationId: tenantOrgId,
          contactId: contact.id,
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
    const correlationId = getOrCreateCorrelationId(req);
    console.error("Dify Inquiry Ingestion Tool Error:", { correlationId, error });
    return NextResponse.json(
      { error: "Failed to create inquiry in database", correlationId },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}
