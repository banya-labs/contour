export function canOpenPipelineClosingWorkflow(stage: string, isManagement: boolean): boolean {
  return stage === "VERIFICATION_CLOSING" && isManagement;
}
