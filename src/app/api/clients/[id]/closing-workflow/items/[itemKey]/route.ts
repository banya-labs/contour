import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { getClosingReadiness, validateClosingEvidence } from "@/lib/closing-workflow";
import { isManagementRole } from "@/lib/authorization";

const itemSchema = z.object({
  status: z.enum(["SUBMITTED", "APPROVED", "REJECTED", "NOT_APPLICABLE"]),
  notes: z.string().trim().max(5000).optional(),
  evidenceValue: z.string().trim().max(5000).optional(),
  linkedDocumentId: z.string().trim().min(1).optional(),
  rejectionReason: z.string().trim().min(5).max(2000).optional(),
});

export const PATCH = createApiHandler({
  requirePermissions: ["pipeline.update"],
  bodySchema: itemSchema,
  handler: async (_request, { params, organizationId, userId, contourRole, body }) => {
    const inquiryId = typeof params?.id === "string" ? params.id : undefined;
    const itemKey = typeof params?.itemKey === "string" ? params.itemKey : undefined;
    if (!inquiryId || !itemKey || !organizationId || !userId) return NextResponse.json({ success: false, error: "Workflow, item, and organization context are required." }, { status: 400 });

    const workflow = await db.closingWorkflow.findFirst({ where: { organizationId, inquiryId }, include: { items: true } });
    const item = workflow?.items.find((candidate) => candidate.key === itemKey);
    if (!workflow || !item) return NextResponse.json({ success: false, error: "Closing checklist item not found." }, { status: 404 });

    const management = isManagementRole(contourRole);
    const inquiry = await db.inquiry.findFirst({ where: { id: inquiryId, organizationId }, select: { assignedAgentId: true, propertyId: true } });
    if (item.assigneeType === "MANAGER" && !management) return NextResponse.json({ success: false, error: "This requirement is assigned to management." }, { status: 403 });
    if (item.assigneeType === "AGENT" && inquiry?.assignedAgentId && inquiry.assignedAgentId !== userId && !management) return NextResponse.json({ success: false, error: "Only the assigned agent can update this requirement." }, { status: 403 });
    if (body.status === "APPROVED" && !management) return NextResponse.json({ success: false, error: "Only management can approve closing requirements." }, { status: 403 });
    if (body.status === "NOT_APPLICABLE" && item.required && !management) return NextResponse.json({ success: false, error: "Only management can waive a required closing requirement." }, { status: 403 });
    const evidenceError = validateClosingEvidence({ ...body, evidenceType: item.evidenceType, evidenceValue: body.evidenceValue ?? body.notes, linkedDocumentId: body.linkedDocumentId ?? item.linkedDocumentId });
    if (evidenceError) return NextResponse.json({ success: false, error: evidenceError }, { status: 400 });
    if (body.linkedDocumentId) {
      const document = body.linkedDocumentId ? await db.vaultDocument.findFirst({ where: { id: body.linkedDocumentId, organizationId, propertyId: inquiry?.propertyId ?? undefined, isDeleted: false }, select: { id: true, isVerified: true } }) : null;
      if (!document) return NextResponse.json({ success: false, error: "A valid Vault document is required for this requirement." }, { status: 400 });
    }

    const updated = await db.$transaction(async (tx) => {
      const next = await tx.closingChecklistItem.update({ where: { id: item.id }, data: { status: body.status, notes: body.notes, evidenceValue: body.evidenceValue ?? (item.evidenceType === "BOOLEAN" || item.evidenceType === "AMOUNT" ? body.notes : undefined), linkedDocumentId: body.linkedDocumentId, rejectionReason: body.status === "REJECTED" ? (body.rejectionReason || body.notes || "Rejected during review.") : undefined, submittedById: userId, submittedAt: new Date(), ...(body.status === "APPROVED" ? { approvedById: userId, approvedAt: new Date() } : { approvedById: null, approvedAt: null }) } });
      const items = await tx.closingChecklistItem.findMany({ where: { workflowId: workflow.id } });
      const readiness = getClosingReadiness(items.map((entry) => ({ ...entry, active: true })));
      await tx.closingWorkflow.update({ where: { id: workflow.id }, data: { status: readiness.ready ? "READY" : "OPEN" } });
      return { next, readiness };
    });
    return NextResponse.json({ success: true, item: updated.next, readiness: updated.readiness });
  },
});
