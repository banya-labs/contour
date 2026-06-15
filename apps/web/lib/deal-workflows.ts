export type DealWorkflowType = "sale" | "rental";

export type DealWorkflowStage = {
  value: string;
  label: string;
  terminal?: boolean;
};

export type DealWorkflowConfig = {
  key: DealWorkflowType;
  label: string;
  dealType: DealWorkflowType;
  stages: DealWorkflowStage[];
  searchFields: string[];
};

const salesStages: DealWorkflowStage[] = [
  { value: "new_enquiry", label: "New enquiry" },
  { value: "qualified", label: "Qualified" },
  { value: "site_visit", label: "Site visit" },
  { value: "offer_made", label: "Offer made" },
  { value: "negotiating", label: "Negotiation" },
  { value: "document_check", label: "Document check" },
  { value: "closing", label: "Closing" },
  { value: "won", label: "Won", terminal: true },
  { value: "lost", label: "Lost", terminal: true },
];

const rentalStages: DealWorkflowStage[] = [
  { value: "new_enquiry", label: "New enquiry" },
  { value: "qualified", label: "Viewing booked" },
  { value: "site_visit", label: "Viewing complete" },
  { value: "offer_made", label: "Application received" },
  { value: "negotiating", label: "Screening" },
  { value: "document_check", label: "Lease draft" },
  { value: "closing", label: "Deposit and signing" },
  { value: "won", label: "Active tenancy", terminal: true },
  { value: "lost", label: "Closed", terminal: true },
];

export const salesDealWorkflow: DealWorkflowConfig = {
  key: "sale",
  label: "Sales",
  dealType: "sale",
  stages: salesStages,
  searchFields: ["title", "listing", "client", "stage", "status", "value"],
};

export const rentalDealWorkflow: DealWorkflowConfig = {
  key: "rental",
  label: "Rentals",
  dealType: "rental",
  stages: rentalStages,
  searchFields: ["title", "listing", "client", "stage", "status", "value"],
};

export const dealWorkflows: Record<DealWorkflowType, DealWorkflowConfig> = {
  sale: salesDealWorkflow,
  rental: rentalDealWorkflow,
};

export function getDealWorkflow(dealType: string | null | undefined) {
  if (dealType === "rental") {
    return rentalDealWorkflow;
  }

  return salesDealWorkflow;
}

export function getDealStageLabel(stage: string, dealType: string | null | undefined = "sale") {
  const workflow = getDealWorkflow(dealType);
  return workflow.stages.find((item) => item.value === stage)?.label ?? stage.replaceAll("_", " ");
}

export function getDealStatusForStage(stage: string) {
  if (stage === "won") {
    return "won";
  }

  if (stage === "lost") {
    return "lost";
  }

  return "open";
}
