import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { createInquirySchema } from "@/lib/validations";
import { smartCache } from "@/lib/cache";
import { normalizePhoneNumber } from "@/lib/phone-utils";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { ApiRouteContext } from "@/lib/api-handler";
import { isPropertyAvailableForNewOpportunity } from "@/lib/property-lifecycle";
import { createInquiryMatchNotifications } from "@/lib/matching/inquiry-match-notifications";
import { getOrCreateContact } from "@/lib/crm/contact-service";
import { inquiryMatchesProperty } from "@/lib/matching/inquiry-property-match";

const getHandler = createApiHandler({
  requirePermissions: ["leads.read"],
  querySchema: z.object({
    assigned: z.string().optional(), // "me" | "all"
    assignedAgentId: z.string().optional(),
    propertyId: z.string().optional(),
    search: z.string().optional(),
  }).partial(),
  handler: async (req, ctx) => {
    const { organizationId, userId, query } = ctx;
    const { assigned, assignedAgentId, propertyId, search } = query;

    const whereClause: Prisma.InquiryWhereInput = { organizationId };

    if (assigned === "me" && userId) {
      whereClause.assignedAgentId = userId;
    } else if (assignedAgentId) {
      whereClause.assignedAgentId = assignedAgentId;
    }

    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    if (search) {
      whereClause.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { clientPhone: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const clients = await db.inquiry.findMany({
      where: whereClause,
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
        property: { select: { id: true, title: true, suburb: true, agencyCommissionPct: true } },
        contact: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" }
    });

    const matchingProperties = await db.property.findMany({
      where: { organizationId, status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
      select: { id: true, title: true, suburb: true, listingType: true, currency: true, askingPrice: true, rentalPrice: true, propertyType: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
    const clientsWithMatches = clients.map((client) => ({
      ...client,
      matchingProperties: matchingProperties.filter((property) => inquiryMatchesProperty(
        {
          lookingFor: client.lookingFor,
          currency: client.currency,
          budgetMax: client.budgetMax ? Number(client.budgetMax) : null,
          preferredSuburbs: client.preferredSuburbs,
          propertyType: client.propertyType,
        },
        {
          listingType: property.listingType,
          currency: property.currency,
          askingPrice: property.askingPrice ? Number(property.askingPrice) : null,
          rentalPrice: property.rentalPrice ? Number(property.rentalPrice) : null,
          suburb: property.suburb,
          propertyType: property.propertyType,
        },
      )).map((property) => ({
        id: property.id,
        title: property.title,
        suburb: property.suburb,
        listingType: property.listingType,
        currency: property.currency,
        price: property.listingType === "FOR_RENT" ? property.rentalPrice : property.askingPrice,
      })),
    }));

    return NextResponse.json({ success: true, clients: clientsWithMatches });
  }
});

const postHandler = createApiHandler({
  requirePermissions: ["pwa.inquiries.update"],
  bodySchema: createInquirySchema,
  handler: async (req, ctx) => {
    const { organizationId, body, userId } = ctx;

    if (body.status && body.status !== "NEW_INQUIRY") {
      return NextResponse.json({ success: false, error: "New opportunities must start at New Inquiry and progress through the pipeline." }, { status: 409 });
    }
    if (body.existingInquiryId && !body.propertyId) {
      return NextResponse.json({ success: false, error: "A property must be attached before an inquiry enters the pipeline." }, { status: 400 });
    }

    if (body.idempotencyKey) {
      const existing = await db.inquiry.findFirst({ where: { organizationId: organizationId!, idempotencyKey: body.idempotencyKey }, include: { property: true, assignedAgent: true } });
      if (existing) return NextResponse.json({ success: true, client: existing, deduplicated: true });
    }

    // Safely resolve assignedAgentId to an existing User record in DB
    const candidateAgentId = body.assignedAgentId || userId || undefined;
    let effectiveAgentId: string | undefined = undefined;

    if (candidateAgentId) {
      const agentUser = await db.user.findUnique({
        where: { id: candidateAgentId },
        select: { id: true },
      });
      if (agentUser) {
        effectiveAgentId = agentUser.id;
      } else if (userId) {
        const currentUser = await db.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (currentUser) {
          effectiveAgentId = currentUser.id;
        }
      }
    }

    let validPropertyId: string | undefined = undefined;
    if (body.propertyId) {
      const property = await db.property.findFirst({
        where: { id: body.propertyId, organizationId: organizationId! },
        select: { id: true, status: true },
      });
      if (property) {
        if (!isPropertyAvailableForNewOpportunity(property.status)) {
          return NextResponse.json({ success: false, error: "This property has already been sold and cannot be attached to a new deal." }, { status: 409 });
        }
        validPropertyId = property.id;
      }
    }

    // Resolve an inquiry to the best currently marketable property when the
    // client came in without a specific listing. Closed inventory is never a
    // candidate for a new pipeline relationship.
    if (!validPropertyId) {
      const candidates = await db.property.findMany({
        where: {
          organizationId: organizationId!,
          status: { not: "SOLD" },
          listingType: body.lookingFor === "FOR_RENT" ? { in: ["FOR_RENT", "BOTH"] } : { in: ["FOR_SALE", "BOTH"] },
          ...(body.propertyType ? { propertyType: body.propertyType } : {}),
          ...(body.preferredSuburbs?.length ? { suburb: { in: body.preferredSuburbs, mode: "insensitive" } } : {}),
        },
        select: { id: true, askingPrice: true, rentalPrice: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      });
      const budgetMax = body.budgetMax;
      const match = candidates.find((property) => {
        if (!budgetMax) return true;
        const price = body.lookingFor === "FOR_RENT" ? property.rentalPrice : property.askingPrice;
        return price == null || Number(price) <= budgetMax * 1.1;
      });
      validPropertyId = match?.id;
    }

    const lockDurationDays = 30;
    const exclusiveLockExpiresAt = new Date();
    exclusiveLockExpiresAt.setDate(exclusiveLockExpiresAt.getDate() + lockDurationDays);

    const clientPhone = normalizePhoneNumber(body.clientPhone);
    let contactId = body.contactId;
    if (contactId) {
      const contact = await db.contact.findFirst({ where: { id: contactId, organizationId: organizationId! }, select: { id: true } });
      if (!contact) return NextResponse.json({ success: false, error: "The selected contact was not found in this workspace." }, { status: 400 });
    } else {
      const contact = await getOrCreateContact(db, { organizationId: organizationId!, name: body.clientName, phone: clientPhone, email: body.clientEmail });
      contactId = contact.id;
    }

    // Reuse an existing open opportunity selected from the pipeline instead of
    // creating a second deal for the same tenant-scoped opportunity. A contact
    // is intentionally allowed to have multiple inquiries: phone number is an
    // identity signal, not an inquiry-level idempotency key.
    if (body.existingInquiryId) {
      const existingInquiry = await db.inquiry.findFirst({
        where: { id: body.existingInquiryId, organizationId: organizationId! },
        select: { id: true, status: true },
      });

      if (!existingInquiry) {
        return NextResponse.json({ success: false, error: "The selected client opportunity was not found." }, { status: 404 });
      }

      if (existingInquiry.status !== "CLOSED") {
        const updated = await db.inquiry.update({
          where: { id: existingInquiry.id },
          data: {
            clientName: body.clientName.trim(),
            contactId,
            clientPhone,
            clientEmail: body.clientEmail?.trim() || null,
            lookingFor: body.lookingFor || "FOR_SALE",
            currency: body.currency || "ZMW",
            notes: body.notes || null,
            status: body.status || existingInquiry.status,
            leadSource: body.leadSource || "OTHER",
            propertyId: validPropertyId || null,
            matchStatus: validPropertyId ? "MATCHED" : "UNMATCHED",
            dealValue: body.dealValue !== undefined ? new Prisma.Decimal(body.dealValue) : undefined,
            ...(effectiveAgentId ? { assignedAgentId: effectiveAgentId } : {}),
            exclusiveLockExpiresAt,
          },
          include: {
            assignedAgent: { select: { name: true, phone: true } },
            property: { select: { id: true, title: true, suburb: true, agencyCommissionPct: true } },
          },
        });

        if (organizationId) {
          smartCache.invalidateTag(organizationId, "clients", "/dashboard/clients");
          smartCache.invalidateTag(organizationId, "pipeline", "/dashboard/pipeline");
          smartCache.invalidateTag(organizationId, "dashboard-metrics");
          smartCache.invalidateTag(organizationId, "dashboard-action-queue");
          smartCache.invalidateTag(organizationId, "agent-summary", "/agent");
        }

        return NextResponse.json({ success: true, client: updated, attached: true });
      }
      // Closed inquiries remain historical; create a new opportunity below.
    }

    const recentDuplicate = await db.inquiry.findFirst({
      where: {
        organizationId: organizationId!,
        clientPhone,
        ...(validPropertyId ? { propertyId: validPropertyId } : {}),
        status: { not: "CLOSED" },
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (validPropertyId && recentDuplicate) return NextResponse.json({ success: true, client: recentDuplicate, deduplicated: true });

    const client = await db.inquiry.create({
      data: {
        organizationId: organizationId!,
        contactId: contactId!,
        clientName: body.clientName.trim(),
        clientPhone,
        clientEmail: body.clientEmail?.trim() || undefined,
        lookingFor: body.lookingFor || "FOR_SALE",
        propertyType: body.propertyType,
        budgetMin: body.budgetMin ? new Prisma.Decimal(body.budgetMin) : undefined,
        budgetMax: body.budgetMax ? new Prisma.Decimal(body.budgetMax) : undefined,
        currency: body.currency || "ZMW",
        preferredSuburbs: body.preferredSuburbs || [],
        notes: body.notes,
        status: body.status || "CONTACTED",
        leadSource: body.leadSource || "OTHER",
        propertyId: validPropertyId,
        matchStatus: validPropertyId ? "MATCHED" : "UNMATCHED",
        dealValue: body.dealValue !== undefined ? new Prisma.Decimal(body.dealValue) : undefined,
        assignedAgentId: effectiveAgentId,
        exclusiveLockExpiresAt,
        idempotencyKey: body.idempotencyKey,
      },
      include: {
        assignedAgent: {
          select: {
            name: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            suburb: true,
            agencyCommissionPct: true,
          },
        },
      },
    });
    await createInquiryMatchNotifications(organizationId!, client.id);

    const availableProperties = await db.property.findMany({
      where: { organizationId: organizationId!, status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
      select: { id: true, title: true, suburb: true, listingType: true, currency: true, askingPrice: true, rentalPrice: true, propertyType: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
    const matchingProperties = availableProperties
      .filter((property) => inquiryMatchesProperty(
        { lookingFor: client.lookingFor, currency: client.currency, budgetMax: client.budgetMax ? Number(client.budgetMax) : null, preferredSuburbs: client.preferredSuburbs, propertyType: client.propertyType },
        { listingType: property.listingType, currency: property.currency, askingPrice: property.askingPrice ? Number(property.askingPrice) : null, rentalPrice: property.rentalPrice ? Number(property.rentalPrice) : null, suburb: property.suburb, propertyType: property.propertyType },
      ))
      .map((property) => ({ id: property.id, title: property.title, suburb: property.suburb, listingType: property.listingType, currency: property.currency, price: property.listingType === "FOR_RENT" ? property.rentalPrice : property.askingPrice }));

    // Invalidate client, pipeline, and dashboard caches across all surfaces
    if (organizationId) {
      smartCache.invalidateTag(organizationId, "clients", "/dashboard/clients");
      smartCache.invalidateTag(organizationId, "pipeline", "/dashboard/pipeline");
      smartCache.invalidateTag(organizationId, "dashboard-metrics");
      smartCache.invalidateTag(organizationId, "dashboard-action-queue");
      smartCache.invalidateTag(organizationId, "agent-summary", "/agent");
    }

    return NextResponse.json({ success: true, client: { ...client, matchingProperties } });
  },
});

export async function GET(req: NextRequest, context: ApiRouteContext) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context: ApiRouteContext) {
  return postHandler(req, context);
}
