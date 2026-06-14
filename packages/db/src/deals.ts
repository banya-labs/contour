import type { DealStage, DealStatus, PrismaClient } from "@prisma/client";

type CurrencyCode = "ZMW" | "USD";

type ContourDealRecord = {
  id: string;
  title: string;
  stage: DealStage;
  status: DealStatus;
  valueCents: number;
  currency: string;
  closedAt: Date | null;
  listingId: string | null;
  clientId: string | null;
  createdAt: Date;
  updatedAt: Date;
  listing: { id: string; title: string } | null;
  client: { id: string; fullName: string } | null;
  paymentPlans: Array<{ id: string }>;
  payments: Array<{ id: string }>;
};

export type ContourDealSummary = {
  id: string;
  title: string;
  stage: DealStage;
  status: DealStatus;
  valueCents: number;
  currency: string;
  closedAt: string | null;
  listingId: string | null;
  clientId: string | null;
  listing: { id: string; title: string } | null;
  client: { id: string; fullName: string } | null;
  paymentPlansCount: number;
  paymentsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ContourDealInput = {
  title: string;
  stage: DealStage;
  status: DealStatus;
  valueCents: number;
  currency: CurrencyCode;
  listingId: string;
  clientId: string;
};

const validDealStages: DealStage[] = [
  "new",
  "viewing",
  "negotiating",
  "contract",
  "closed_won",
  "closed_lost",
];

const validDealStatuses: DealStatus[] = ["open", "won", "lost"];
const validCurrencies: CurrencyCode[] = ["ZMW", "USD"];

const contourDealSelect = {
  id: true,
  title: true,
  stage: true,
  status: true,
  valueCents: true,
  currency: true,
  closedAt: true,
  listingId: true,
  clientId: true,
  createdAt: true,
  updatedAt: true,
  listing: {
    select: {
      id: true,
      title: true,
    },
  },
  client: {
    select: {
      id: true,
      fullName: true,
    },
  },
  paymentPlans: {
    select: {
      id: true,
    },
  },
  payments: {
    select: {
      id: true,
    },
  },
} as const;

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toDealSummary(deal: ContourDealRecord): ContourDealSummary {
  return {
    id: deal.id,
    title: deal.title,
    stage: deal.stage,
    status: deal.status,
    valueCents: deal.valueCents,
    currency: deal.currency,
    closedAt: deal.closedAt ? deal.closedAt.toISOString() : null,
    listingId: deal.listingId,
    clientId: deal.clientId,
    listing: deal.listing,
    client: deal.client,
    paymentPlansCount: deal.paymentPlans.length,
    paymentsCount: deal.payments.length,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  };
}

export function parseContourDealFormData(formData: FormData): ContourDealInput {
  const title = readString(formData, "title");
  const stage = readString(formData, "stage");
  const status = readString(formData, "status");
  const value = readString(formData, "value");
  const currency = readString(formData, "currency").toUpperCase() || "ZMW";
  const listingId = readString(formData, "listingId");
  const clientId = readString(formData, "clientId");

  if (!title) {
    throw new Error("Deal title is required");
  }
  if (!stage) {
    throw new Error("Deal stage is required");
  }
  if (!status) {
    throw new Error("Deal status is required");
  }
  if (!value) {
    throw new Error("Deal value is required");
  }
  if (!listingId) {
    throw new Error("Linked listing is required");
  }
  if (!clientId) {
    throw new Error("Linked client is required");
  }

  const normalizedValue = Number(value);
  if (!Number.isFinite(normalizedValue)) {
    throw new Error("Deal value must be a number");
  }
  if (!validDealStages.includes(stage as DealStage)) {
    throw new Error("Deal stage is invalid");
  }
  if (!validDealStatuses.includes(status as DealStatus)) {
    throw new Error("Deal status is invalid");
  }
  if (!validCurrencies.includes(currency as CurrencyCode)) {
    throw new Error("Deal currency is invalid");
  }
  if (normalizedValue <= 0) {
    throw new Error("Deal value must be greater than zero");
  }

  return {
    title,
    stage: stage as DealStage,
    status: status as DealStatus,
    valueCents: Math.round(normalizedValue * 100),
    currency: currency as CurrencyCode,
    listingId,
    clientId,
  };
}

export async function listContourDeals(
  prisma: PrismaClient,
  limit = 50,
): Promise<ContourDealSummary[]> {
  const rows = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: contourDealSelect,
  });

  return rows.map((deal) => toDealSummary(deal as ContourDealRecord));
}

export async function getContourDeal(
  prisma: PrismaClient,
  id: string,
): Promise<ContourDealSummary | null> {
  const row = await prisma.deal.findUnique({
    where: { id },
    select: contourDealSelect,
  });

  return row ? toDealSummary(row as ContourDealRecord) : null;
}

export async function createContourDeal(
  prisma: PrismaClient,
  input: ContourDealInput,
): Promise<ContourDealSummary> {
  const row = await prisma.deal.create({
    data: input,
    select: contourDealSelect,
  });

  return toDealSummary(row as ContourDealRecord);
}

export async function updateContourDeal(
  prisma: PrismaClient,
  id: string,
  input: ContourDealInput,
): Promise<ContourDealSummary> {
  const row = await prisma.deal.update({
    where: { id },
    data: input,
    select: contourDealSelect,
  });

  return toDealSummary(row as ContourDealRecord);
}
