type DecimalValue = number | string | { toString(): string };

type ClosedInquiry = {
  id: string;
  status: string;
  outcome: string | null;
  closedAt: Date | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  lookingFor: string;
  dealValue: DecimalValue | null;
  currency: string;
  lostReason: string | null;
  notes: string | null;
  assignedAgent: { name: string } | null;
  property: {
    id: string;
    title: string;
    propertyType: string;
    suburb: string;
    city: string;
    bedrooms: number | null;
    bathrooms: DecimalValue | null;
    plotSizeSqm: DecimalValue | null;
    askingPrice: DecimalValue | null;
    currency: string;
  } | null;
};

// Build the receipt from the committed inquiry, never from the requested outcome.
export function createClosedDealResult(inquiry: ClosedInquiry, competingInquiriesClosed = 0) {
  if (inquiry.status !== "CLOSED" || !inquiry.closedAt || (inquiry.outcome !== "WON" && inquiry.outcome !== "LOST")) return null;
  return {
    inquiryId: inquiry.id,
    outcome: inquiry.outcome as "WON" | "LOST",
    closedAt: inquiry.closedAt.toISOString(),
    transactionType: inquiry.lookingFor === "FOR_RENT" ? "RENTAL_PLACEMENT" : "PROPERTY_SALE",
    buyer: { name: inquiry.clientName, phone: inquiry.clientPhone, email: inquiry.clientEmail },
    dealValue: inquiry.dealValue?.toString() ?? null,
    currency: inquiry.currency,
    lostReason: inquiry.outcome === "LOST" ? inquiry.lostReason : null,
    notes: inquiry.notes,
    agentName: inquiry.assignedAgent?.name ?? null,
    competingInquiriesClosed,
    property: inquiry.property ? {
      id: inquiry.property.id,
      title: inquiry.property.title,
      propertyType: inquiry.property.propertyType,
      suburb: inquiry.property.suburb,
      city: inquiry.property.city,
      bedrooms: inquiry.property.bedrooms,
      currency: inquiry.property.currency,
      bathrooms: inquiry.property.bathrooms?.toString() ?? null,
      plotSizeSqm: inquiry.property.plotSizeSqm?.toString() ?? null,
      askingPrice: inquiry.property.askingPrice?.toString() ?? null,
    } : null,
  };
}

export type ClosedDealResult = NonNullable<ReturnType<typeof createClosedDealResult>>;
