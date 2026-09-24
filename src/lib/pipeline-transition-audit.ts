import type { PipelineOutcome } from "@prisma/client";
import type { PipelineStage } from "./deal-workflow";

export type PipelineTransitionAuditDetails = {
  previousStatus: PipelineStage;
  status: PipelineStage;
  outcome: PipelineOutcome | null;
  reason: string | null;
  override: boolean;
  missingRequirements: readonly string[];
  competingInquiriesClosed: number;
};

export function createPipelineTransitionAuditDetails(input: PipelineTransitionAuditDetails) {
  return {
    previousStatus: input.previousStatus,
    status: input.status,
    outcome: input.outcome,
    reason: input.reason,
    override: input.override,
    missingRequirements: [...input.missingRequirements],
    competingInquiriesClosed: input.competingInquiriesClosed,
  };
}
