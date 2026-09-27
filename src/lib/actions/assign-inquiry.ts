export function canSelfAssignInquiry(input: { status: string; assignedAgentId: string | null }): boolean {
  return input.status === "NEW_INQUIRY" && !input.assignedAgentId;
}
