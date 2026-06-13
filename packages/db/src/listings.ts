import type { ListingStatus, PrismaClient } from "@prisma/client";

type ContourListingRecord = {
  id: string;
  title: string;
  propertyType: string;
  status: ListingStatus;
  priceCents: number;
  currency: string;
  ownerName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContourListingSummary = {
  id: string;
  title: string;
  propertyType: string;
  status: string;
  priceCents: number;
  currency: string;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContourListingInput = {
  title: string;
  propertyType: string;
  status: ListingStatus;
  priceCents: number;
  currency: string;
  ownerName: string | null;
};

type ContourListingQueryClient = PrismaClient;

type ContourListingSelect = {
  id: true;
  title: true;
  propertyType: true;
  status: true;
  priceCents: true;
  currency: true;
  ownerName: true;
  createdAt: true;
  updatedAt: true;
};

const contourListingSelect = {
  id: true,
  title: true,
  propertyType: true,
  status: true,
  priceCents: true,
  currency: true,
  ownerName: true,
  createdAt: true,
  updatedAt: true,
} satisfies ContourListingSelect;

function toListingSummary(listing: ContourListingRecord): ContourListingSummary {
  return {
    id: listing.id,
    title: listing.title,
    propertyType: listing.propertyType,
    status: listing.status,
    priceCents: listing.priceCents,
    currency: listing.currency,
    ownerName: listing.ownerName,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parseContourListingFormData(formData: FormData): ContourListingInput {
  const title = readString(formData, "title");
  const propertyType = readString(formData, "propertyType");
  const status = readString(formData, "status");
  const price = readString(formData, "price");
  const currency = readString(formData, "currency").toUpperCase() || "ZMW";
  const ownerName = readString(formData, "ownerName");

  if (!title) {
    throw new Error("Listing title is required");
  }
  if (!propertyType) {
    throw new Error("Property type is required");
  }
  if (!status) {
    throw new Error("Listing status is required");
  }
  if (!price) {
    throw new Error("Listing price is required");
  }

  const validStatuses: ListingStatus[] = [
    "available",
    "reserved",
    "under_maintenance",
    "sold",
  ];
  const normalizedPrice = Number(price);
  if (!Number.isFinite(normalizedPrice)) {
    throw new Error("Listing price must be a number");
  }
  if (!validStatuses.includes(status as ListingStatus)) {
    throw new Error("Listing status is invalid");
  }

  return {
    title,
    propertyType,
    status: status as ListingStatus,
    priceCents: Math.round(normalizedPrice * 100),
    currency,
    ownerName: ownerName || null,
  };
}

export async function listContourListings(
  prisma: ContourListingQueryClient,
  limit = 50,
): Promise<ContourListingSummary[]> {
  const rows = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: contourListingSelect,
  });

  return rows.map(toListingSummary);
}

export async function getContourListing(
  prisma: ContourListingQueryClient,
  id: string,
): Promise<ContourListingSummary | null> {
  const row = await prisma.listing.findUnique({
    where: { id },
    select: contourListingSelect,
  });

  return row ? toListingSummary(row) : null;
}

export async function createContourListing(
  prisma: ContourListingQueryClient,
  input: ContourListingInput,
): Promise<ContourListingSummary> {
  const row = await prisma.listing.create({
    data: input,
    select: contourListingSelect,
  });

  return toListingSummary(row);
}

export async function updateContourListing(
  prisma: ContourListingQueryClient,
  id: string,
  input: ContourListingInput,
): Promise<ContourListingSummary> {
  const row = await prisma.listing.update({
    where: { id },
    data: input,
    select: contourListingSelect,
  });

  return toListingSummary(row);
}
