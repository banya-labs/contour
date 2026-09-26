import type { Prisma, PrismaClient } from "@prisma/client";
import { DEFAULT_CLOSING_REQUIREMENT_TEMPLATES } from "./closing-workflow";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function ensureDefaultClosingRequirementTemplates(
  client: DbClient,
  organizationId: string,
  createdById: string,
) {
  const existing = await client.closingRequirementTemplate.count({ where: { organizationId } });
  if (existing > 0) return;

  await client.closingRequirementTemplate.createMany({
    data: DEFAULT_CLOSING_REQUIREMENT_TEMPLATES.map((template) => ({
      organizationId,
      createdById,
      ...template,
    })),
  });
}

export async function ensureClosingWorkflow(
  client: DbClient,
  input: { organizationId: string; inquiryId: string; actorId: string },
) {
  await ensureDefaultClosingRequirementTemplates(client, input.organizationId, input.actorId);

  const existing = await client.closingWorkflow.findUnique({
    where: { inquiryId: input.inquiryId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (existing) return existing;

  const templates = await client.closingRequirementTemplate.findMany({
    where: { organizationId: input.organizationId, active: true, archivedAt: null },
    orderBy: { sortOrder: "asc" },
  });

  return client.closingWorkflow.create({
    data: {
      organizationId: input.organizationId,
      inquiryId: input.inquiryId,
      createdById: input.actorId,
      items: {
        create: templates.map((template) => ({
          key: template.key,
          label: template.label,
          description: template.description,
          category: template.category,
          required: template.required,
          assigneeType: template.assigneeType,
          evidenceType: template.evidenceType,
          sortOrder: template.sortOrder,
        })),
      },
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getClosingWorkflow(client: DbClient, organizationId: string, inquiryId: string) {
  return client.closingWorkflow.findFirst({
    where: { organizationId, inquiryId },
    include: { items: { orderBy: { sortOrder: "asc" }, include: { linkedDocument: { select: { id: true, title: true, isVerified: true, isDeleted: true } } } } },
  });
}
