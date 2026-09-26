import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { getClosingReadiness } from "@/lib/closing-workflow";
import { ensureClosingWorkflow, getClosingWorkflow } from "@/lib/closing-workflow-persistence";

const createSchema = z.object({}).optional();

export const GET = createApiHandler({
  requirePermissions: ["pipeline.read"],
  handler: async (_request, { params, organizationId }) => {
    const inquiryId = typeof params?.id === "string" ? params.id : undefined;
    if (!inquiryId || !organizationId) return NextResponse.json({ success: false, error: "Inquiry and organization context are required." }, { status: 400 });
    const workflow = await getClosingWorkflow(db, organizationId, inquiryId);
    if (!workflow) return NextResponse.json({ success: false, error: "Closing workflow not found." }, { status: 404 });
    return NextResponse.json({ success: true, workflow, readiness: getClosingReadiness(workflow.items.map((item) => ({ ...item, active: true }))) });
  },
});

export const POST = createApiHandler({
  requirePermissions: ["pipeline.update"],
  bodySchema: createSchema,
  handler: async (_request, { params, organizationId, userId }) => {
    const inquiryId = typeof params?.id === "string" ? params.id : undefined;
    if (!inquiryId || !organizationId || !userId) return NextResponse.json({ success: false, error: "Inquiry, organization, and actor are required." }, { status: 400 });
    const inquiry = await db.inquiry.findFirst({ where: { id: inquiryId, organizationId }, select: { id: true, status: true } });
    if (!inquiry) return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });
    if (inquiry.status !== "VERIFICATION_CLOSING") return NextResponse.json({ success: false, error: "A closing workflow can only be created for Verification & Closing deals." }, { status: 409 });
    const workflow = await ensureClosingWorkflow(db, { organizationId, inquiryId, actorId: userId });
    return NextResponse.json({ success: true, workflow, readiness: getClosingReadiness(workflow.items.map((item) => ({ ...item, active: true }))) });
  },
});
