import type { InquiryStatus, PipelineOutcome } from "@prisma/client";

export const ACTIVE_PIPELINE_STAGE_CODES = [
  "NEW_INQUIRY",
  "QUALIFIED",
  "VIEWING_OR_OFFER",
  "NEGOTIATING",
  "VERIFICATION_CLOSING",
] as const;

export type ActivePipelineStage = (typeof ACTIVE_PIPELINE_STAGE_CODES)[number];
export type PipelineStage = ActivePipelineStage | "CLOSED";

export type PipelineRequirementContext = {
  hasClient: boolean;
  hasProperty: boolean;
  hasAssignedAgent: boolean;
  hasQualificationNote: boolean;
  hasBudget: boolean;
  hasNextAction: boolean;
  hasViewingOutcome: boolean;
  hasOfferValue: boolean;
  hasCurrentValue: boolean;
  hasRecentContact: boolean;
  hasFollowUpDate: boolean;
  hasFinalValue: boolean;
  hasRequiredDocuments: boolean;
};

export type PipelineStageDefinition = {
  id: PipelineStage;
  label: string;
  description: string;
  nextAction: string;
};

export type TransitionDecision =
  | { allowed: true; requiresReason: boolean; missingRequirements: readonly string[] }
  | { allowed: false; requiresReason: boolean; missingRequirements: readonly string[]; reason: string };

export const PIPELINE_STAGES: readonly PipelineStageDefinition[] = [
  {
    id: "NEW_INQUIRY",
    label: "New enquiry",
    description: "A contact has been captured and needs qualification.",
    nextAction: "Qualify enquiry",
  },
  {
    id: "QUALIFIED",
    label: "Qualified",
    description: "The client's need, budget, and property fit are understood.",
    nextAction: "Schedule viewing",
  },
  {
    id: "VIEWING_OR_OFFER",
    label: "Viewing / offer",
    description: "The client is engaging with the property or preparing an offer.",
    nextAction: "Start negotiation",
  },
  {
    id: "NEGOTIATING",
    label: "Negotiation",
    description: "Price or terms are actively being discussed.",
    nextAction: "Send for verification",
  },
  {
    id: "VERIFICATION_CLOSING",
    label: "Verification & closing",
    description: "Legal, identity, payment, and signing checks are being completed.",
    nextAction: "Mark outcome",
  },
  {
    id: "CLOSED",
    label: "Won / lost",
    description: "The inquiry has reached a terminal outcome.",
    nextAction: "Review outcome",
  },
] as const;

const STAGE_INDEX = new Map<PipelineStage, number>(
  PIPELINE_STAGES.map((stage, index) => [stage.id, index]),
);

export function getStageDefinition(stage: PipelineStage): PipelineStageDefinition {
  return PIPELINE_STAGES.find((definition) => definition.id === stage) ?? PIPELINE_STAGES[0];
}

export function getNextStage(stage: ActivePipelineStage): ActivePipelineStage | "CLOSED" {
  const index = ACTIVE_PIPELINE_STAGE_CODES.indexOf(stage);
  return ACTIVE_PIPELINE_STAGE_CODES[index + 1] ?? "CLOSED";
}

export function getMissingRequirements(
  targetStage: PipelineStage,
  context: PipelineRequirementContext,
): string[] {
  const missing: string[] = [];

  if (targetStage === "QUALIFIED") {
    if (!context.hasClient) missing.push("client contact");
    if (!context.hasProperty) missing.push("linked property");
    if (!context.hasAssignedAgent) missing.push("assigned agent");
    if (!context.hasQualificationNote || !context.hasBudget) missing.push("qualification and budget");
    if (!context.hasNextAction) missing.push("next action");
  }

  if (targetStage === "VIEWING_OR_OFFER") {
    if (!context.hasViewingOutcome && !context.hasOfferValue) missing.push("viewing outcome or offer value");
  }

  if (targetStage === "NEGOTIATING") {
    if (!context.hasOfferValue) missing.push("offer value");
    if (!context.hasCurrentValue) missing.push("current value");
    if (!context.hasRecentContact) missing.push("recent contact");
    if (!context.hasFollowUpDate) missing.push("follow-up date");
  }

  if (targetStage === "VERIFICATION_CLOSING") {
    if (!context.hasFinalValue) missing.push("final agreed value");
    if (!context.hasRequiredDocuments) missing.push("required closing documents");
  }

  return missing;
}

export function canMovePipelineStage(input: {
  currentStage: PipelineStage;
  targetStage: PipelineStage;
  context: PipelineRequirementContext;
  direction?: "forward" | "backward";
  reason?: string;
  isManagerOverride?: boolean;
}): TransitionDecision {
  const { currentStage, targetStage, context, reason, isManagerOverride = false } = input;

  if (currentStage === "CLOSED") {
    return { allowed: false, requiresReason: false, missingRequirements: [], reason: "Closed inquiries cannot be reopened." };
  }

  const currentIndex = STAGE_INDEX.get(currentStage);
  const targetIndex = STAGE_INDEX.get(targetStage);
  if (currentIndex === undefined || targetIndex === undefined || currentStage === targetStage) {
    return { allowed: false, requiresReason: false, missingRequirements: [], reason: "Choose a different pipeline stage." };
  }

  // Active pipeline stages are intentionally non-blocking. The popup is the
  // human confirmation point; stage requirements are guidance, not gates.
  // This also allows agents to correct a stage in either direction without
  // inventing a note or completing work that has not happened yet.
  if (targetStage !== "CLOSED" && ACTIVE_PIPELINE_STAGE_CODES.includes(targetStage) && currentIndex !== undefined) {
    return { allowed: true, requiresReason: false, missingRequirements: [] };
  }

  const missingRequirements = getMissingRequirements(targetStage, context);
  if (missingRequirements.length > 0 && !isManagerOverride) {
    return {
      allowed: false,
      requiresReason: false,
      missingRequirements,
      reason: `Missing: ${missingRequirements.join(", ")}.`,
    };
  }

  return { allowed: true, requiresReason: isManagerOverride && missingRequirements.length > 0, missingRequirements };
}

export function mapLegacyPipelineState(
  status: InquiryStatus | string,
  outcome?: PipelineOutcome | string | null,
): { status: PipelineStage; outcome: PipelineOutcome | null } {
  if (outcome === "WON" || outcome === "LOST") return { status: "CLOSED", outcome };

  switch (status) {
    case "CONTACTED":
      return { status: "QUALIFIED", outcome: null };
    case "VIEWING_SCHEDULED":
    case "OFFER_MADE":
      return { status: "VIEWING_OR_OFFER", outcome: null };
    case "MANAGEMENT_HANDOVER":
      return { status: "VERIFICATION_CLOSING", outcome: null };
    case "CLOSED_WON":
      return { status: "CLOSED", outcome: "WON" };
    case "CLOSED_LOST":
      return { status: "CLOSED", outcome: "LOST" };
    case "QUALIFIED":
    case "VIEWING_OR_OFFER":
    case "NEGOTIATING":
    case "VERIFICATION_CLOSING":
    case "CLOSED":
    case "NEW_INQUIRY":
      return { status: status as PipelineStage, outcome: null };
    default:
      return { status: "NEW_INQUIRY", outcome: null };
  }
}
