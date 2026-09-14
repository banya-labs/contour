import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { updateFollowUpTaskSchema } from "@/lib/validations";

export const GET = createApiHandler({
  handler: async (_req, { params, organizationId }) => {
    const taskId = typeof params?.id === "string" ? params.id : undefined;
    if (!taskId) return NextResponse.json({ success: false, error: "Task ID required." }, { status: 400 });

    const task = await db.followUpTask.findFirst({
      where: { id: taskId, organizationId: organizationId! },
      include: {
        assignedUser: { select: { id: true, name: true } },
        inquiry: { select: { id: true, clientName: true } },
        property: { select: { id: true, title: true, suburb: true } },
      },
    });

    if (!task) return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    return NextResponse.json({ success: true, task });
  },
});

export const PATCH = createApiHandler({
  bodySchema: updateFollowUpTaskSchema,
  handler: async (_req, { params, body, organizationId, userId }) => {
    const taskId = typeof params?.id === "string" ? params.id : undefined;
    if (!taskId) return NextResponse.json({ success: false, error: "Task ID required." }, { status: 400 });

    const task = await db.followUpTask.findFirst({
      where: { id: taskId, organizationId: organizationId! },
      select: { id: true, status: true },
    });
    if (!task) return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });

    if (body.assignedUserId) {
      const member = await db.member.findFirst({
        where: { organizationId: organizationId!, userId: body.assignedUserId, status: "active" },
        select: { id: true },
      });
      if (!member) return NextResponse.json({ success: false, error: "Assigned user must be an active org member." }, { status: 400 });
    }

    const isCompleting = body.status === "COMPLETED" && task.status !== "COMPLETED";

    const updated = await db.followUpTask.update({
      where: { id: task.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.dueDate !== undefined ? { dueDate: new Date(body.dueDate) } : {}),
        ...(body.assignedUserId !== undefined ? { assignedUserId: body.assignedUserId } : {}),
        ...(isCompleting ? { completedAt: new Date(), completedById: userId } : {}),
      },
      include: { assignedUser: { select: { id: true, name: true } } },
    });

    await db.auditLog.create({
      data: {
        organizationId: organizationId!,
        userId,
        action: isCompleting ? "FOLLOW_UP_TASK_COMPLETED" : "FOLLOW_UP_TASK_UPDATED",
        entityType: "FollowUpTask",
        entityId: task.id,
        details: { status: body.status },
      },
    });

    return NextResponse.json({ success: true, task: updated });
  },
});

export const DELETE = createApiHandler({
  handler: async (_req, { params, organizationId, userId }) => {
    const taskId = typeof params?.id === "string" ? params.id : undefined;
    if (!taskId) return NextResponse.json({ success: false, error: "Task ID required." }, { status: 400 });

    const task = await db.followUpTask.findFirst({
      where: { id: taskId, organizationId: organizationId! },
      select: { id: true },
    });
    if (!task) return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });

    await db.followUpTask.update({
      where: { id: task.id },
      data: { status: "CANCELLED" },
    });

    await db.auditLog.create({
      data: {
        organizationId: organizationId!,
        userId,
        action: "FOLLOW_UP_TASK_CANCELLED",
        entityType: "FollowUpTask",
        entityId: task.id,
        details: {},
      },
    });

    return NextResponse.json({ success: true });
  },
});
