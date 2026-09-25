import type { InquiryStatus } from "@prisma/client";

const PIPELINE_ORDER: readonly InquiryStatus[] = [
  "NEW_INQUIRY", "CONTACTED", "VIEWING_SCHEDULED", "NEGOTIATING", "OFFER_MADE", "MANAGEMENT_HANDOVER", "CLOSED",
];

export function canAdvancePipelineStage(current: InquiryStatus, next: InquiryStatus, dealValue?: number | null): boolean {
  return current !== "CLOSED" && next !== "CLOSED" && PIPELINE_ORDER.includes(current) && PIPELINE_ORDER.includes(next) && current !== next;
}
