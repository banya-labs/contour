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
import { scoreAllPropertiesForInquiry } from "@/lib/matching/score";
import { buildInquiryMatchingProfile } from "@/lib/matching/inquiry-profile";
import { buildPropertyMatchingCandidate } from "@/lib/matching/property-profile";
import { isActiveInquiry, isQualifyingMatch, TERMINAL_INQUIRY_STATUSES } from "@/lib/matching/policy";
import { candidateSelect } from "@/lib/matching/service";
import { matchingScope } from "@/lib/matching/api";
import { inquiryVisibility, canManageMatching } from "@/lib/matching/visibility";
import { attachPropertyInTransaction } from "@/lib/matching/attach-property";
import { visibleContactsWhere } from "@/lib/crm/contact-visibility";


const getHandler = createApiHandler({
  requirePermissions: ["leads.read"],
  querySchema: z.object({
    assigned: z.string().optional(), // "me" | "all"
    assignedAgentId: z.string().optional(),
    propertyId: z.string().optional(),
    search: z.string().optional(),
    activeOnly: z.enum(["true", "false"]).optional(),
  }).partial(),
  handler: async (req, ctx) => {
    const { organizationId, userId, query } = ctx;
    const { assigned, assignedAgentId, propertyId, search, activeOnly } = query;

    const whereClause: Prisma.InquiryWhereInput = {
      organizationId,
      ...(activeOnly === "true" ? { status: { notIn: ["CLOSED", "CLOSED_WON", "CLOSED_LOST"] } } : {}),
    };

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
      where: { organizationId, status: "AVAILABLE" },
      select: { id: true, title: true, suburb: true, listingType: true, currency: true, askingPrice: true, rentalPrice: true, propertyType: true, bedrooms: true, bathrooms: true, plotSizeSqm: true, matchingMetadata: true },
      orderBy: { updatedAt: "desc" },
    });
    const candidates = matchingProperties.map(buildPropertyMatchingCandidate);
    const propertiesById = new Map(matchingProperties.map((property) => [property.id, property]));
    const clientsWithMatches = clients.map((client) => ({
      ...client,
      matchingProperties: client.propertyId || !isActiveInquiry(client.status) ? [] : scoreAllPropertiesForInquiry(buildInquiryMatchingProfile(client), candidates).filter(isQualifyingMatch).map((result) => {
        const property = propertiesById.get(result.propertyId)!;
        return {
        id: property.id,
        title: property.title,
        suburb: property.suburb,
        listingType: property.listingType,
        currency: property.currency,
        price: result.effectivePrice,
        score: result.score,
      };
      }),
    }));

    return NextResponse.json({ success: true, clients: clientsWithMatches });
  }
});

const postHandler = createApiHandler({
  requirePermissions: ["pwa.inquiries.update"],
  bodySchema: createInquirySchema,
  handler: async (req, ctx) => {
    const { organizationId, body, userId } = ctx;
    const scope = matchingScope(ctx);
    if (body.creationSurface && !body.contactId) return NextResponse.json({ success: false, error: "Select a contact before creating an inquiry" }, { status: 400 });
    if (!canManageMatching(scope) && body.assignedAgentId && body.assignedAgentId !== userId) return NextResponse.json({ success: false, error: "Only management can assign another agent" }, { status: 403 });

    if (body.creationSurface && !body.propertyType) {
      return NextResponse.json({ success: false, error: "Property type is required for inquiries created from this surface." }, { status: 400 });
    }

    if (body.status && body.status !== "NEW_INQUIRY") {
      return NextResponse.json({ success: false, error: "New opportunities must start at New Inquiry and progress through the pipeline." }, { status: 409 });
    }
    if (body.existingInquiryId && !body.propertyId) {
      return NextResponse.json({ success: false, error: "A property must be attached before an inquiry enters the pipeline." }, { status: 400 });
    }

    if (body.idempotencyKey) {
      const existing = await db.inquiry.findFirst({ where: { ...inquiryVisibility(scope), idempotencyKey: body.idempotencyKey }, include: { property: true, assignedAgent: true } });
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
    let resolvedPropertyValue: number | undefined;
    if (body.propertyId) {
      const property = await db.property.findFirst({
        where: { id: body.propertyId, organizationId: organizationId! },
        select: { id: true, status: true, askingPrice: true, rentalPrice: true, currency: true },
      });
      if (!property) return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
      if (property) {
        if (!isPropertyAvailableForNewOpportunity(property.status)) {
          return NextResponse.json({ success: false, error: "This property has already been sold and cannot be attached to a new deal." }, { status: 409 });
        }
        validPropertyId = property.id;
        const propertyValue = body.lookingFor === "FOR_RENT" ? property.rentalPrice : property.askingPrice;
        resolvedPropertyValue = propertyValue == null ? undefined : Number(propertyValue);
      }
    }

    const lockDurationDays = 30;
    const exclusiveLockExpiresAt = new Date();
    exclusiveLockExpiresAt.setDate(exclusiveLockExpiresAt.getDate() + lockDurationDays);

    let clientPhone = normalizePhoneNumber(body.clientPhone);
    let contactId = body.contactId;
    if (contactId) {
      const contact = await db.contact.findFirst({ where: { AND: [await visibleContactsWhere(scope), { id: contactId }] }, select: { id: true, name: true, phone: true, email: true } });
      if (!contact) return NextResponse.json({ success: false, error: "The selected contact was not found in this workspace." }, { status: 400 });
      body.clientName = contact.name; clientPhone = contact.phone; body.clientEmail = contact.email || undefined;
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
        where: { ...inquiryVisibility(scope), id: body.existingInquiryId },
        select: { id: true, status: true, propertyId: true },
      });

      if (!existingInquiry) {
        return NextResponse.json({ success: false, error: "The selected client opportunity was not found." }, { status: 404 });
      }

      if (!TERMINAL_INQUIRY_STATUSES.some((status) => status === existingInquiry.status)) {
        const updated = await db.$transaction(async (tx) => {
          await tx.inquiry.update({
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
            dealValue: resolvedPropertyValue !== undefined
              ? new Prisma.Decimal(resolvedPropertyValue)
              : body.dealValue !== undefined
              ? new Prisma.Decimal(body.dealValue)
              : undefined,
            ...(effectiveAgentId ? { assignedAgentId: effectiveAgentId } : {}),
            exclusiveLockExpiresAt,
          },
          include: {
            assignedAgent: { select: { name: true, phone: true } },
            property: { select: { id: true, title: true, suburb: true, agencyCommissionPct: true } },
          },
        });
          await attachPropertyInTransaction(tx, scope, { inquiryId: existingInquiry.id, propertyId: validPropertyId || null, expectedPropertyId: existingInquiry.propertyId });
          return tx.inquiry.findUniqueOrThrow({ where: { id: existingInquiry.id }, include: { assignedAgent: { select: { name: true, phone: true } }, property: { select: { id: true, title: true, suburb: true, agencyCommissionPct: true } } } });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        if (organizationId) {
          smartCache.invalidateTag(organizationId, "clients", "/dashboard/clients");
          smartCache.invalidateTag(organizationId, "pipeline", "/dashboard/pipeline");
          smartCache.invalidateTag(organizationId, "dashboard-metrics");
          smartCache.invalidateTag(organizationId, "dashboard-action-queue");
          smartCache.invalidateTag(organizationId, "agent-summary", "/agent");
        }

        await createInquiryMatchNotifications(organizationId!, updated.id);
        return NextResponse.json({ success: true, client: updated, attached: true });
      }
      // Closed inquiries remain historical; create a new opportunity below.
    }

    const client = await db.$transaction(async (tx) => {
    const created = await tx.inquiry.create({
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
        bedroomsMin: body.bedroomsMin,
        bathroomsMin: body.bathroomsMin !== undefined ? new Prisma.Decimal(body.bathroomsMin) : undefined,
        areaMinSqm: body.areaMinSqm !== undefined ? new Prisma.Decimal(body.areaMinSqm) : undefined,
        notes: body.notes,
        matchingProfile: body.matchingProfile,
        status: body.status || "NEW_INQUIRY",
        leadSource: body.leadSource || "OTHER",
        propertyId: null,
        matchStatus: "UNMATCHED",
        dealValue: resolvedPropertyValue !== undefined
          ? new Prisma.Decimal(resolvedPropertyValue)
          : body.dealValue !== undefined
          ? new Prisma.Decimal(body.dealValue)
          : undefined,
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
    if (validPropertyId) {
      await attachPropertyInTransaction(tx, scope, { inquiryId: created.id, propertyId: validPropertyId, expectedPropertyId: null });
      return tx.inquiry.findUniqueOrThrow({ where: { id: created.id }, include: { assignedAgent: { select: { name: true, phone: true } }, property: { select: { id: true, title: true, suburb: true, agencyCommissionPct: true } } } });
    }
    return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }).catch(async (error: unknown) => {
      if (body.idempotencyKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const saved = await db.inquiry.findFirst({ where: { ...inquiryVisibility(scope), idempotencyKey: body.idempotencyKey }, include: { assignedAgent: { select: { name: true, phone: true } }, property: { select: { id: true, title: true, suburb: true, agencyCommissionPct: true } } } });
        if (saved) return saved;
      }
      throw error;
    });
    await createInquiryMatchNotifications(organizationId!, client.id);

    const availableProperties = await db.property.findMany({
      where: { organizationId: organizationId!, status: "AVAILABLE" },
      select: candidateSelect,
      orderBy: { updatedAt: "desc" },
    });
    const propertiesById = new Map(availableProperties.map((property) => [property.id, property]));
    const matchingProperties = client.propertyId ? [] : scoreAllPropertiesForInquiry(buildInquiryMatchingProfile(client), availableProperties.map(buildPropertyMatchingCandidate)).filter(isQualifyingMatch).map((result) => ({ ...propertiesById.get(result.propertyId)!, score: result.score, price: result.effectivePrice }));

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
