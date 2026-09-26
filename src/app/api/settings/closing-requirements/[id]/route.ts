import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { isManagementRole } from "@/lib/authorization";
import { validateClosingRequirementTemplate } from "@/lib/closing-workflow";

const schema = z.object({ key: z.string(), label: z.string(), description: z.string(), category: z.string(), required: z.boolean(), assigneeType: z.enum(["AGENT", "MANAGER"]), evidenceType: z.enum(["NOTE", "DOCUMENT", "BOOLEAN", "AMOUNT"]), sortOrder: z.number().int().min(0), active: z.boolean() });

export const PATCH = createApiHandler({ requirePermissions: ["org.update"], bodySchema: schema, handler: async (_request, { params, body, organizationId, contourRole }) => {
  const id = typeof params?.id === "string" ? params.id : undefined;
  if (!id || !organizationId) return NextResponse.json({ success: false, error: "Requirement and organization context are required." }, { status: 400 });
  if (!isManagementRole(contourRole)) return NextResponse.json({ success: false, error: "Only management can configure closing requirements." }, { status: 403 });
  try {
    const existing = await db.closingRequirementTemplate.findFirst({ where: { id, organizationId }, select: { id: true } });
    if (!existing) return NextResponse.json({ success: false, error: "Requirement not found." }, { status: 404 });
    const template = await db.closingRequirementTemplate.update({ where: { id }, data: validateClosingRequirementTemplate(body) });
    return NextResponse.json({ success: true, template });
  } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Invalid closing requirement." }, { status: 400 }); }
} });

export const DELETE = createApiHandler({ requirePermissions: ["org.update"], handler: async (_request, { params, organizationId, contourRole }) => {
  const id = typeof params?.id === "string" ? params.id : undefined;
  if (!id || !organizationId) return NextResponse.json({ success: false, error: "Requirement and organization context are required." }, { status: 400 });
  if (!isManagementRole(contourRole)) return NextResponse.json({ success: false, error: "Only management can archive closing requirements." }, { status: 403 });
  const existing = await db.closingRequirementTemplate.findFirst({ where: { id, organizationId }, select: { id: true } });
  if (!existing) return NextResponse.json({ success: false, error: "Requirement not found." }, { status: 404 });
  const activeRequiredCount = await db.closingRequirementTemplate.count({ where: { organizationId, active: true, archivedAt: null, required: true, id: { not: id } } });
  if (activeRequiredCount === 0) return NextResponse.json({ success: false, error: "Keep at least one active required closing requirement." }, { status: 409 });
  const template = await db.closingRequirementTemplate.update({ where: { id }, data: { active: false, archivedAt: new Date() } });
  return NextResponse.json({ success: true, template });
} });
