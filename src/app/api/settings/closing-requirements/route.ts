import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { isManagementRole } from "@/lib/authorization";
import { ensureDefaultClosingRequirementTemplates } from "@/lib/closing-workflow-persistence";
import { validateClosingRequirementTemplate } from "@/lib/closing-workflow";

const templateSchema = z.object({
  key: z.string(), label: z.string(), description: z.string(), category: z.string(), required: z.boolean(),
  assigneeType: z.enum(["AGENT", "MANAGER"]), evidenceType: z.enum(["NOTE", "DOCUMENT", "BOOLEAN", "AMOUNT"]),
  sortOrder: z.number().int().min(0), active: z.boolean().optional(),
});

export const GET = createApiHandler({
  requirePermissions: ["org.read"],
  handler: async (_request, { organizationId, userId }) => {
    if (!organizationId || !userId) return NextResponse.json({ success: false, error: "Organization context required." }, { status: 400 });
    await ensureDefaultClosingRequirementTemplates(db, organizationId, userId);
    const templates = await db.closingRequirementTemplate.findMany({ where: { organizationId }, orderBy: [{ active: "desc" }, { sortOrder: "asc" }] });
    return NextResponse.json({ success: true, templates });
  },
});

export const POST = createApiHandler({
  requirePermissions: ["org.update"],
  bodySchema: templateSchema,
  handler: async (_request, { organizationId, userId, contourRole, body }) => {
    if (!organizationId || !userId) return NextResponse.json({ success: false, error: "Organization context required." }, { status: 400 });
    if (!isManagementRole(contourRole)) return NextResponse.json({ success: false, error: "Only management can configure closing requirements." }, { status: 403 });
    try {
      const input = validateClosingRequirementTemplate(body);
      const template = await db.closingRequirementTemplate.create({ data: { organizationId, createdById: userId, ...input } });
      return NextResponse.json({ success: true, template }, { status: 201 });
    } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Invalid closing requirement." }, { status: 400 }); }
  },
});
