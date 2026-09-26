export const CLOSING_ASSIGNEES = ["AGENT", "MANAGER"] as const;
export const CLOSING_EVIDENCE_TYPES = ["NOTE", "DOCUMENT", "BOOLEAN", "AMOUNT"] as const;
export const CLOSING_ITEM_STATUSES = ["PENDING", "SUBMITTED", "APPROVED", "REJECTED", "NOT_APPLICABLE"] as const;

export type ClosingAssignee = (typeof CLOSING_ASSIGNEES)[number];
export type ClosingEvidenceType = (typeof CLOSING_EVIDENCE_TYPES)[number];
export type ClosingItemStatus = (typeof CLOSING_ITEM_STATUSES)[number];

export type ClosingRequirementTemplate = {
  key: string;
  label: string;
  description: string;
  category: string;
  required: boolean;
  assigneeType: ClosingAssignee;
  evidenceType: ClosingEvidenceType;
  sortOrder: number;
  active: boolean;
};

export type ClosingChecklistItemSnapshot = ClosingRequirementTemplate & {
  status: ClosingItemStatus;
  notes?: string | null;
  rejectionReason?: string | null;
};

export type ClosingReadiness = {
  ready: boolean;
  pending: number;
  blocked: number;
  requiredCount: number;
  approvedCount: number;
};

export type ClosingDecision =
  | { allowed: true }
  | { allowed: false; reason: string };

export const DEFAULT_CLOSING_REQUIREMENT_TEMPLATES: readonly ClosingRequirementTemplate[] = [
  { key: "BUYER_IDENTITY", label: "Buyer identity verified", description: "Verify the buyer's identity document.", category: "Identity", required: true, assigneeType: "AGENT", evidenceType: "DOCUMENT", sortOrder: 10, active: true },
  { key: "SELLER_AUTHORITY", label: "Seller authority confirmed", description: "Confirm the seller or landlord has authority to transact.", category: "Legal", required: true, assigneeType: "MANAGER", evidenceType: "DOCUMENT", sortOrder: 20, active: true },
  { key: "TITLE_DOCUMENTS", label: "Title documents verified", description: "Verify the relevant title or ownership documents in the Vault.", category: "Legal", required: true, assigneeType: "MANAGER", evidenceType: "DOCUMENT", sortOrder: 30, active: true },
  { key: "AGREEMENT_SIGNED", label: "Agreement signed", description: "Record the signed sale, lease, or mandate agreement.", category: "Legal", required: true, assigneeType: "MANAGER", evidenceType: "DOCUMENT", sortOrder: 40, active: true },
  { key: "PAYMENT_CONFIRMED", label: "Payment confirmed", description: "Confirm the required deposit or payment status.", category: "Payment", required: true, assigneeType: "MANAGER", evidenceType: "BOOLEAN", sortOrder: 50, active: true },
  { key: "COMMISSION_CONFIRMED", label: "Commission confirmed", description: "Confirm the final deal value and commission split.", category: "Payment", required: true, assigneeType: "MANAGER", evidenceType: "AMOUNT", sortOrder: 60, active: true },
  { key: "FINAL_HANDOVER", label: "Final handover prepared", description: "Confirm the post-close handover action is ready.", category: "Handover", required: false, assigneeType: "MANAGER", evidenceType: "NOTE", sortOrder: 70, active: true },
];

export function getDefaultClosingRequirementTemplates(): readonly ClosingRequirementTemplate[] {
  return DEFAULT_CLOSING_REQUIREMENT_TEMPLATES.map((template) => ({ ...template }));
}

export function validateClosingRequirementTemplate(input: Partial<ClosingRequirementTemplate>): ClosingRequirementTemplate {
  const key = input.key?.trim();
  const label = input.label?.trim();
  if (!key || !/^[A-Z][A-Z0-9_]{2,63}$/.test(key)) throw new Error("Requirement key must use uppercase letters, numbers, and underscores.");
  if (!label || label.length > 120) throw new Error("Requirement label is required and must be 120 characters or fewer.");
  if (!input.description?.trim()) throw new Error("Requirement description is required.");
  if (!input.category?.trim()) throw new Error("Requirement category is required.");
  if (!CLOSING_ASSIGNEES.includes(input.assigneeType as ClosingAssignee)) throw new Error("Invalid requirement assignee.");
  if (!CLOSING_EVIDENCE_TYPES.includes(input.evidenceType as ClosingEvidenceType)) throw new Error("Invalid requirement evidence type.");
  return {
    key,
    label,
    description: input.description.trim(),
    category: input.category.trim(),
    required: input.required !== false,
    assigneeType: input.assigneeType as ClosingAssignee,
    evidenceType: input.evidenceType as ClosingEvidenceType,
    sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0,
    active: input.active !== false,
  };
}

export function getClosingReadiness(items: readonly ClosingChecklistItemSnapshot[]): ClosingReadiness {
  const required = items.filter((item) => item.required && item.status !== "NOT_APPLICABLE");
  const approved = required.filter((item) => item.status === "APPROVED");
  const blocked = required.filter((item) => item.status === "REJECTED").length;
  const pending = required.filter((item) => item.status !== "APPROVED" && item.status !== "REJECTED").length;
  return { ready: required.length > 0 && approved.length === required.length, pending, blocked, requiredCount: required.length, approvedCount: approved.length };
}

export function canCloseDeal(input: { role: "AGENT" | "MANAGER"; outcome: "WON" | "LOST"; readiness: ClosingReadiness; reason?: string }): ClosingDecision {
  if (input.role !== "MANAGER") return { allowed: false, reason: "Only a manager can close a deal." };
  if (input.outcome === "LOST" && !input.reason?.trim()) return { allowed: false, reason: "A lost reason is required." };
  if (input.outcome === "WON" && !input.readiness.ready) return { allowed: false, reason: "Complete all required closing requirements before marking the deal won." };
  return { allowed: true };
}
