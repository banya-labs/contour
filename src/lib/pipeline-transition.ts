import type { InquiryStatus } from "@prisma/client";

const PIPELINE_ORDER: readonly InquiryStatus[] = [
  "NEW_INQUIRY", "CONTACTED", "VIEWING_SCHEDULED", "NEGOTIATING", "OFFER_MADE", "MANAGEMENT_HANDOVER", "CLOSED",
];

export function canAdvancePipelineStage(current: InquiryStatus, next: InquiryStatus, dealValue?: number | null): boolean {
  if (current === "CLOSED" || next === "NEW_INQUIRY") return false;
  const currentIndex = PIPELINE_ORDER.indexOf(current);
  const nextIndex = PIPELINE_ORDER.indexOf(next);
  if (currentIndex < 0 || nextIndex !== currentIndex + 1) return false;
  if (next === "OFFER_MADE" && (!dealValue || dealValue <= 0)) return false;
  return true;
}
