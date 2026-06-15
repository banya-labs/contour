export type LeaseStageValue =
  | "enquiry_received"
  | "viewing_scheduled"
  | "viewing_completed"
  | "application_received"
  | "screening"
  | "lease_draft"
  | "active_tenancy"
  | "closed";

export type LeaseWorkflowStage = {
  value: LeaseStageValue;
  label: string;
  terminal?: boolean;
};

export type LeaseWorkflowConfig = {
  label: string;
  stages: LeaseWorkflowStage[];
  searchFields: string[];
};

export const leaseWorkflow: LeaseWorkflowConfig = {
  label: "Leases",
  stages: [
    { value: "enquiry_received", label: "Enquiry received" },
    { value: "viewing_scheduled", label: "Viewing scheduled" },
    { value: "viewing_completed", label: "Viewing completed" },
    { value: "application_received", label: "Application received" },
    { value: "screening", label: "Screening" },
    { value: "lease_draft", label: "Lease draft" },
    { value: "active_tenancy", label: "Active tenancy" },
    { value: "closed", label: "Closed", terminal: true },
  ],
  searchFields: ["title", "listing", "tenant", "stage", "status", "rent", "charges"],
};

export function getLeaseStageLabel(stage: string) {
  return leaseWorkflow.stages.find((item) => item.value === stage)?.label ?? stage.replaceAll("_", " ");
}

export function getLeaseStatusForStage(stage: string) {
  return stage === "closed" ? "ended" : "active";
}
