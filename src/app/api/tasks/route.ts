import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { createFollowUpTaskSchema } from "@/lib/validations";

const getHandler = createApiHandler({
  handler: async (req, ctx) => {
    const { organizationId } = ctx;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const assignedUserId = searchParams.get("assignedUserId");
    const inquiryId = searchParams.get("inquiryId");
    const propertyId = searchParams.get("propertyId");
    const dueBefore = searchParams.get("dueBefore");
    const dueAfter = searchParams.get("dueAfter");

    const tasks = await db.followUpTask.findMany({
      where: {
        organizationId,
        ...(status ? { status: status as any } : {}),
        ...(assignedUserId ? { assignedUserId } : {}),
        ...(inquiryId ? { inquiryId } : {}),
        ...(propertyId ? { propertyId } : {}),
        ...(dueBefore || dueAfter ? {
          dueDate: {
            ...(dueBefore ? { lte: new Date(dueBefore) } : {}),
            ...(dueAfter ? { gte: new Date(dueAfter) } : {}),
          }
        } : {}),
      },
      include: {
        assignedUser: { select: { id: true, name: true } },
        inquiry: { select: { id: true, clientName: true } },
        property: { select: { id: true, title: true, suburb: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ success: true, tasks });
  },
});

const postHandler = createApiHandler({
  bodySchema: createFollowUpTaskSchema,
  handler: async (req, ctx) => {
    const { organizationId, body, userId } = ctx;

    // Validate assigned user is a member of this org
    const member = await db.member.findFirst({
      where: { organizationId: organizationId!, userId: body.assignedUserId, status: "active" },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json({ success: false, error: "Assigned user must be an active member of this organization." }, { status: 400 });
    }

    if (body.inquiryId) {
      const inquiry = await db.inquiry.findFirst({ where: { id: body.inquiryId, organizationId: organizationId! }, select: { id: true } });
      if (!inquiry) return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 400 });
    }

    if (body.propertyId) {
      const property = await db.property.findFirst({ where: { id: body.propertyId, organizationId: organizationId! }, select: { id: true } });
      if (!property) return NextResponse.json({ success: false, error: "Property not found." }, { status: 400 });
    }

    const task = await db.followUpTask.create({
      data: {
        organizationId: organizationId!,
        assignedUserId: body.assignedUserId,
        inquiryId: body.inquiryId || null,
        propertyId: body.propertyId || null,
        title: body.title,
        description: body.description || null,
        priority: body.priority,
        dueDate: new Date(body.dueDate),
      },
      include: {
        assignedUser: { select: { id: true, name: true } },
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: organizationId!,
        userId,
        action: "FOLLOW_UP_TASK_CREATED",
        entityType: "FollowUpTask",
        entityId: task.id,
        details: { title: task.title, assignedUserId: task.assignedUserId, dueDate: task.dueDate },
      },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  },
});

export async function GET(req: NextRequest, context?: any) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context?: any) {
  return postHandler(req, context);
}
