import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { createInquirySchema } from "@/lib/validations";
import { z } from "zod";

const getHandler = createApiHandler({
  requirePermissions: ["leads.read"],
  querySchema: z.object({
    assigned: z.string().optional(), // "me" | "all"
    assignedAgentId: z.string().optional(),
    search: z.string().optional(),
  }).partial(),
  handler: async (req, ctx) => {
    const { organizationId, userId, query } = ctx;
    const { assigned, assignedAgentId, search } = query;

    const whereClause: any = { organizationId };

    if (assigned === "me" && userId) {
      whereClause.assignedAgentId = userId;
    } else if (assignedAgentId) {
      whereClause.assignedAgentId = assignedAgentId;
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
        property: { select: { id: true, title: true, suburb: true } },
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, clients });
  }
});

const postHandler = createApiHandler({
  requirePermissions: ["pwa.inquiries.update"],
  bodySchema: createInquirySchema,
  handler: async (req, ctx) => {
    const { organizationId, body } = ctx;

    if (body.assignedAgentId) {
      const assignedMember = await db.member.findFirst({
        where: { organizationId: organizationId!, userId: body.assignedAgentId, status: "active" },
        select: { userId: true },
      });
      if (!assignedMember) {
        return NextResponse.json({ success: false, error: "Assigned agent must be an active member of this organization." }, { status: 400 });
      }
    }

    if (body.propertyId) {
      const property = await db.property.findFirst({ where: { id: body.propertyId, organizationId: organizationId! }, select: { id: true } });
      if (!property) return NextResponse.json({ success: false, error: "Selected property was not found in this organization." }, { status: 400 });
    }

    const lockDurationDays = 30;
    const exclusiveLockExpiresAt = new Date();
    exclusiveLockExpiresAt.setDate(exclusiveLockExpiresAt.getDate() + lockDurationDays);

    const client = await db.inquiry.create({
      data: {
        organizationId: organizationId!,
        clientName: body.clientName,
        clientPhone: body.clientPhone,
        clientEmail: body.clientEmail || undefined,
        lookingFor: body.lookingFor,
        propertyType: body.propertyType,
        budgetMin: body.budgetMin ? (body.budgetMin as any) : undefined,
        budgetMax: body.budgetMax ? (body.budgetMax as any) : undefined,
        currency: body.currency,
        preferredSuburbs: body.preferredSuburbs,
        notes: body.notes,
        status: body.status || "CONTACTED",
        leadSource: body.leadSource,
        propertyId: body.propertyId || undefined,
        dealValue: body.dealValue as any,
        assignedAgentId: body.assignedAgentId || undefined,
        exclusiveLockExpiresAt
      },
      include: {
        assignedAgent: {
          select: {
            name: true,
            phone: true,
          }
        }
      }
    });

    return NextResponse.json({ success: true, client });
  }
});

export async function GET(req: NextRequest, context?: any) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context?: any) {
  return postHandler(req, context);
}
