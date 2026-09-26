CREATE TYPE "ClosingWorkflowStatus" AS ENUM ('OPEN', 'READY', 'CLOSED', 'CANCELLED');
CREATE TYPE "ClosingChecklistItemStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'NOT_APPLICABLE');
CREATE TYPE "ClosingAssigneeType" AS ENUM ('AGENT', 'MANAGER');
CREATE TYPE "ClosingEvidenceType" AS ENUM ('NOTE', 'DOCUMENT', 'BOOLEAN', 'AMOUNT');

CREATE TABLE "closing_requirement_template" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "assigneeType" "ClosingAssigneeType" NOT NULL DEFAULT 'MANAGER',
  "evidenceType" "ClosingEvidenceType" NOT NULL DEFAULT 'NOTE',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "archivedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "closing_requirement_template_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "closing_requirement_template_organizationId_key_key" ON "closing_requirement_template"("organizationId", "key");
CREATE INDEX "closing_requirement_template_organizationId_active_sortOrder_idx" ON "closing_requirement_template"("organizationId", "active", "sortOrder");
ALTER TABLE "closing_requirement_template" ADD CONSTRAINT "closing_requirement_template_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "closing_requirement_template" ADD CONSTRAINT "closing_requirement_template_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON UPDATE CASCADE;

CREATE TABLE "closing_workflow" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "inquiryId" TEXT NOT NULL,
  "status" "ClosingWorkflowStatus" NOT NULL DEFAULT 'OPEN',
  "createdById" TEXT NOT NULL,
  "reviewedById" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "closing_workflow_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "closing_workflow_inquiryId_key" ON "closing_workflow"("inquiryId");
CREATE INDEX "closing_workflow_organizationId_status_idx" ON "closing_workflow"("organizationId", "status");
ALTER TABLE "closing_workflow" ADD CONSTRAINT "closing_workflow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "closing_workflow" ADD CONSTRAINT "closing_workflow_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "closing_workflow" ADD CONSTRAINT "closing_workflow_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON UPDATE CASCADE;
ALTER TABLE "closing_workflow" ADD CONSTRAINT "closing_workflow_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON UPDATE CASCADE;

CREATE TABLE "closing_checklist_item" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL,
  "assigneeType" "ClosingAssigneeType" NOT NULL,
  "evidenceType" "ClosingEvidenceType" NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "status" "ClosingChecklistItemStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "evidenceValue" TEXT,
  "rejectionReason" TEXT,
  "linkedDocumentId" TEXT,
  "submittedById" TEXT,
  "approvedById" TEXT,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "closing_checklist_item_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "closing_checklist_item_workflowId_key_key" ON "closing_checklist_item"("workflowId", "key");
CREATE INDEX "closing_checklist_item_workflowId_status_idx" ON "closing_checklist_item"("workflowId", "status");
CREATE INDEX "closing_checklist_item_linkedDocumentId_idx" ON "closing_checklist_item"("linkedDocumentId");
ALTER TABLE "closing_checklist_item" ADD CONSTRAINT "closing_checklist_item_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "closing_workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "closing_checklist_item" ADD CONSTRAINT "closing_checklist_item_linkedDocumentId_fkey" FOREIGN KEY ("linkedDocumentId") REFERENCES "vault_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "closing_checklist_item" ADD CONSTRAINT "closing_checklist_item_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user"("id") ON UPDATE CASCADE;
ALTER TABLE "closing_checklist_item" ADD CONSTRAINT "closing_checklist_item_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON UPDATE CASCADE;
