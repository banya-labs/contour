import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { createInquirySchema } from "@/lib/validations";

const getHandler = createApiHandler({
  handler: async (req, ctx) => {
    const { organizationId } = ctx;

    const clients = await db.inquiry.findMany({
      where: { organizationId },
      include: {
        assignedAgent: {
          select: {
            name: true,
            phone: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, clients });
  }
});

const postHandler = createApiHandler({
  bodySchema: createInquirySchema,
  handler: async (req, ctx) => {
    const { organizationId, body } = ctx;

    const lockDurationDays = 30;
    const exclusiveLockExpiresAt = new Date();
    exclusiveLockExpiresAt.setDate(exclusiveLockExpiresAt.getDate() + lockDurationDays);

    const client = await db.inquiry.create({
      data: {
        organizationId: organizationId || "org_demo_contour",
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
        status: "CONTACTED",
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
