export type LandlordStatementSummary = {
  id: string;
  status: string;
  landlordName: string;
  currency: string;
  grossRentCollected: number | string;
  rentDue: number | string;
  arrearsClosing: number | string;
  agencyFeeDeducted: number | string;
  maintenanceDeducted: number | string;
  netLandlordPayout: number | string;
  property?: { title?: string; suburb?: string; city?: string };
  statementMonth: number;
  statementYear: number;
};

export type LandlordStatementDocument = LandlordStatementSummary & {
  arrearsBroughtForward: number | string;
  createdAt: string;
  approvedAt: string | null;
  organization: {
    name: string;
    logo: string | null;
    profile: { primaryOfficeAddress: string | null; primaryPhone: string | null; primaryEmail: string | null } | null;
  };
};

export function landlordStatementViewerUrl(id: string) {
  return `/dashboard/statements/${encodeURIComponent(id)}/print`;
}

export async function loadLandlordStatement(id: string, fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<LandlordStatementDocument> {
  const response = await fetcher(`/api/statements/${encodeURIComponent(id)}`, { cache: "no-store", signal });
  const data = await response.json() as { success?: boolean; statement?: LandlordStatementDocument; error?: string };
  if (!response.ok || !data.success || !data.statement?.id) throw new Error(data.error || "Unable to load the saved statement. Please try again.");
  return data.statement;
}

export const STATEMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft — awaiting management approval",
  APPROVED_BY_MANAGER: "Approved by management",
  SENT_TO_LANDLORD: "Sent to landlord",
  PAID_OUT: "Payout recorded",
};
