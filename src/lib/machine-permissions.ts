import type { Permission } from "./authorization";

export const MACHINE_OPERATIONS = {
  search_properties: { scope: "read:properties", permissions: ["properties.read", "pwa.listings.share"] },
  create_inquiry_or_lead: { scope: "write:inquiries", permissions: ["leads.create", "pwa.inquiries.update"] },
  get_rental_arrears: { scope: "read:arrears", permissions: ["leases.read"] },
  get_revenue_commission: { scope: "read:commission", permissions: ["finance.read"] },
  get_property_documents: { scope: "read:documents", permissions: ["vault.read", "vault.download"] },
} as const;

export type MachineOperation = keyof typeof MACHINE_OPERATIONS;
export function isMachineOperation(value: string): value is MachineOperation {
  return Object.prototype.hasOwnProperty.call(MACHINE_OPERATIONS, value);
}
export function canUseMachineOperation(operation: MachineOperation, scopes: readonly string[], permissions: readonly Permission[]) {
  const rule = MACHINE_OPERATIONS[operation];
  return scopes.includes(rule.scope) && (operation === "get_property_documents"
    ? rule.permissions.every(permission => permissions.includes(permission))
    : rule.permissions.some(permission => permissions.includes(permission)));
}

type CommissionGroup = {
  currency: string;
  status: string;
  _sum: { grossValue: unknown; agencyCommissionAmount: unknown; agentSplitAmount: unknown };
  _count: { _all: number };
};
export function summarizeMachineCommission(groups: readonly CommissionGroup[]) {
  const totals: Record<string, { grossVolume: number; agencyCommission: number; agentSplits: number; expectedCommission: number }> = {};
  let closedDealsCount = 0;
  let pipelineDealsCount = 0;
  for (const group of groups) {
    const amounts = totals[group.currency] ||= { grossVolume: 0, agencyCommission: 0, agentSplits: 0, expectedCommission: 0 };
    if (["EARNED", "RECEIVED", "AGENT_PAID_OUT"].includes(group.status)) {
      amounts.grossVolume += Number(group._sum.grossValue || 0);
      amounts.agencyCommission += Number(group._sum.agencyCommissionAmount || 0);
      amounts.agentSplits += Number(group._sum.agentSplitAmount || 0);
    }
    if (group.status === "EXPECTED") {
      amounts.expectedCommission += Number(group._sum.agencyCommissionAmount || 0);
      pipelineDealsCount += group._count._all;
    } else closedDealsCount += group._count._all;
  }
  const format = (field: keyof (typeof totals)[string]) => Object.entries(totals).sort(([a], [b]) => a.localeCompare(b)).map(([currency, amounts]) => `${currency} ${amounts[field].toLocaleString("en-US")}`).join(" + ") || "0";
  return {
    totalGrossVolume: format("grossVolume"),
    earnedAgencyCommission: format("agencyCommission"),
    agentSplitsPaid: format("agentSplits"),
    pipelineExpectedCommission: format("expectedCommission"),
    totalsByCurrency: totals,
    closedDealsCount,
    pipelineDealsCount,
  };
}
