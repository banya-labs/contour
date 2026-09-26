import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { getClosingReadiness } from "@/lib/closing-workflow";
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
    if (body.status === "APPROVED" && !management) return NextResponse.json({ success: false, error: "Only management can approve closing requirements." }, { status: 403 });
    if (body.status === "REJECTED" && !body.rejectionReason) return NextResponse.json({ success: false, error: "A rejection reason is required." }, { status: 400 });
    if (body.status === "NOT_APPLICABLE" && item.required && !management) return NextResponse.json({ success: false, error: "Only management can waive a required closing requirement." }, { status: 403 });
    if (body.linkedDocumentId) {
      const document = await db.vaultDocument.findFirst({ where: { id: body.linkedDocumentId, organizationId, isDeleted: false }, select: { id: true } });
      if (!document) return NextResponse.json({ success: false, error: "The linked Vault document was not found in this agency." }, { status: 400 });
    }

    const updated = await db.$transaction(async (tx) => {
      const next = await tx.closingChecklistItem.update({ where: { id: item.id }, data: { status: body.status, notes: body.notes, evidenceValue: body.evidenceValue, linkedDocumentId: body.linkedDocumentId, rejectionReason: body.rejectionReason, submittedById: userId, submittedAt: new Date(), ...(body.status === "APPROVED" ? { approvedById: userId, approvedAt: new Date() } : { approvedById: null, approvedAt: null }) } });
      const items = await tx.closingChecklistItem.findMany({ where: { workflowId: workflow.id } });
      const readiness = getClosingReadiness(items.map((entry) => ({ ...entry, active: true })));
      await tx.closingWorkflow.update({ where: { id: workflow.id }, data: { status: readiness.ready ? "READY" : "OPEN" } });
      return { next, readiness };
    });
    return NextResponse.json({ success: true, item: updated.next, readiness: updated.readiness });
  },
});
