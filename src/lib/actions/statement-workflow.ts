const NEXT_STATUS: Record<string, string> = {
  DRAFT: "APPROVED_BY_MANAGER",
  APPROVED_BY_MANAGER: "SENT_TO_LANDLORD",
  SENT_TO_LANDLORD: "PAID_OUT",
};

export function canTransitionStatement(current: string, next: string): boolean {
  return NEXT_STATUS[current] === next;
}
