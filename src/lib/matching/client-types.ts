export type MatchRow = {
  propertyId: string; score: number; isMatch: boolean; reasons: string[]; hardFailures: string[]; unmetPreferences: string[]; missingData: string[]; effectivePrice: number | null;
  property: { id: string; title: string; suburb: string; listingType: string; currency: string; status: string };
  inquiry?: { id: string; clientName: string; clientPhone: string; contactId: string; propertyId: string | null; contact?: { id: string; name: string; phone: string } | null };
};
export type MatchEnvelope = { results: MatchRow[]; total: number; page: number; pageSize: number; hasMore: boolean; calculatedAt: string; policyVersion: string; matchingEnabled?: boolean; inquiry?: { id: string; propertyId: string | null } };
