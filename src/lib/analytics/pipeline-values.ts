type PipelineValueInput = { status: string; outcome?: string | null; dealValue?: number | null; propertyValue?: number | null };

export function calculatePipelineStageValues(inquiries: readonly PipelineValueInput[]): Record<string, number> {
  const values: Record<string, number> = {};
  for (const inquiry of inquiries) {
    const value = inquiry.dealValue ?? inquiry.propertyValue ?? 0;
    const stage = inquiry.status === "CLOSED" && inquiry.outcome === "WON" ? "COMPLETED" : inquiry.status;
    values[stage] = (values[stage] || 0) + value;
  }
  return values;
}
