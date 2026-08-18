import { Prisma, type ListingStatus, type PrismaClient } from "@prisma/client";
import { type DocumentCategory } from "@prisma/client";

type ContourListingRecord = {
  id: string;
  title: string;
  propertyType: string;
  status: ListingStatus;
  priceCents: number;
  currency: string;
  ownerName: string | null;
  address: string | null;
  description?: string | null;
  locationArea: string | null;
  province: string | null;
  cityTown: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type ContourListingDocumentRecord = {
  id: string;
  listingId?: string | null;
  documentName: string;
  blobUrl: string;
  blobKey: string | null;
  mimeType: string | null;
  fileSizeBytes: bigint | null;
  createdAt: Date;
};

export type ContourListingSummary = {
  id: string;
  title: string;
  propertyType: string;
  status: string;
  priceCents: number;
  currency: string;
  ownerName: string | null;
  address: string | null;
  description: string | null;
  locationArea: string | null;
  province: string | null;
  cityTown: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ContourListingDocumentSummary = {
  id: string;
  documentName: string;
  blobUrl: string;
  blobKey: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  isImage: boolean;
  createdAt: string;
};

export type ContourListingWithDocuments = ContourListingSummary & {
  documents: ContourListingDocumentSummary[];
};

export type ContourListingInput = {
  title: string;
  propertyType: string;
  status: ListingStatus;
  priceCents: number;
  currency: string;
  ownerName: string | null;
  address: string | null;
  description: string | null;
  locationArea: string | null;
  province: string | null;
  cityTown: string | null;
  latitude: number | null;
  longitude: number | null;
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
  address: true;
  description?: true;
  locationArea: true;
  province: true;
  cityTown: true;
  latitude: true;
  longitude: true;
  createdAt: true;
  updatedAt: true;
};

type ContourListingDocumentSelect = {
  id: true;
  documentName: true;
  blobUrl: true;
  blobKey: true;
  mimeType: true;
  fileSizeBytes: true;
  createdAt: true;
};

const contourListingDocumentSelect = {
  id: true,
  documentName: true,
  blobUrl: true,
  blobKey: true,
  mimeType: true,
  fileSizeBytes: true,
  createdAt: true,
} satisfies ContourListingDocumentSelect;

const contourListingSelect = {
  id: true,
  title: true,
  propertyType: true,
  status: true,
  priceCents: true,
  currency: true,
  ownerName: true,
  address: true,
  description: true,
  locationArea: true,
  province: true,
  cityTown: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
} satisfies ContourListingSelect;

const contourListingSelectLegacy = {
  id: true,
  title: true,
  propertyType: true,
  status: true,
  priceCents: true,
  currency: true,
  ownerName: true,
  address: true,
  locationArea: true,
  province: true,
  cityTown: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
} satisfies ContourListingSelect;

function isMissingColumnError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("42703") || error.message.includes("does not exist");
}

let listingDescriptionColumnExistsPromise: Promise<boolean> | null = null;

function canUseQueryRaw(prisma: ContourListingQueryClient) {
  return typeof (prisma as { $queryRaw?: unknown }).$queryRaw === "function";
}

async function hasListingDescriptionColumn(prisma: ContourListingQueryClient) {
  if (!listingDescriptionColumnExistsPromise) {
    listingDescriptionColumnExistsPromise = prisma
      .$queryRaw<Array<{ exists: boolean }>>(Prisma.sql`
        select exists (
          select 1
          from information_schema.columns
          where table_name = 'listings'
            and column_name = 'description'
        ) as "exists"
      `)
      .then((rows) => Boolean(rows[0]?.exists))
      .catch(() => false);
  }

  return listingDescriptionColumnExistsPromise;
}

function listingSelectSql(includeDescription: boolean) {
  return Prisma.sql`
    select
      l.id,
      l.title,
      l.property_type as "propertyType",
      l.status::text as status,
      l.price_cents as "priceCents",
      l.currency,
      l.owner_name as "ownerName",
      l.address,
      l.location_area as "locationArea",
      l.province,
      l.city_town as "cityTown",
      l.latitude,
      l.longitude,
      ${includeDescription ? Prisma.sql`l.description as description,` : Prisma.sql`null::text as description,`}
      l.created_at as "createdAt",
      l.updated_at as "updatedAt"
    from listings l
  `;
}

function listingSelectSqlById(id: string, includeDescription: boolean) {
  return Prisma.sql`
    ${listingSelectSql(includeDescription)}
    where l.id = ${id}::uuid
    limit 1
  `;
}

function listingSelectSqlList(limit: number, includeDescription: boolean) {
  return Prisma.sql`
    ${listingSelectSql(includeDescription)}
    order by l.created_at desc
    limit ${limit}
  `;
}

function listingDocumentsSql(listingIds: string[]) {
  return Prisma.sql`
    select
      d.id,
      d.listing_id as "listingId",
      d.document_name as "documentName",
      d.blob_url as "blobUrl",
      d.blob_key as "blobKey",
      d.mime_type as "mimeType",
      d.file_size_bytes as "fileSizeBytes",
      d.created_at as "createdAt"
    from documents d
    where d.deleted_at is null
      and d.listing_id in (${Prisma.join(listingIds.map((id) => Prisma.sql`${id}::uuid`))})
    order by d.created_at desc
  `;
}

function listingInputData(
  input: ContourListingInput,
  includeDescription: boolean,
): ContourListingInput & { description: string | null } {
  return includeDescription ? input : { ...input, description: null };
}

function toListingSummary(listing: ContourListingRecord): ContourListingSummary {
  return {
    id: listing.id,
    title: listing.title,
    propertyType: listing.propertyType,
    status: listing.status,
    priceCents: listing.priceCents,
    currency: listing.currency,
    ownerName: listing.ownerName,
    address: listing.address,
    description: listing.description ?? null,
    locationArea: listing.locationArea,
    province: listing.province,
    cityTown: listing.cityTown,
    latitude: listing.latitude,
    longitude: listing.longitude,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}

function isImageMimeType(mimeType: string | null) {
  return Boolean(mimeType?.toLowerCase().startsWith("image/"));
}

function toListingDocumentSummary(document: ContourListingDocumentRecord): ContourListingDocumentSummary {
  return {
    id: document.id,
    documentName: document.documentName,
    blobUrl: document.blobUrl,
    blobKey: document.blobKey,
    mimeType: document.mimeType,
    fileSizeBytes: document.fileSizeBytes == null ? null : Number(document.fileSizeBytes),
    isImage: isImageMimeType(document.mimeType),
    createdAt: document.createdAt.toISOString(),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalNumber(formData: FormData, key: string) {
  const value = readString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be a number`);
  }

  return parsed;
}

export function parseContourListingFormData(formData: FormData): ContourListingInput {
  const title = readString(formData, "title");
  const propertyType = readString(formData, "propertyType");
  const status = readString(formData, "status");
  const price = readString(formData, "price");
  const currency = readString(formData, "currency").toUpperCase() || "ZMW";
  const ownerName = readString(formData, "ownerName");
  const address = readString(formData, "address");
  const description = readString(formData, "description");
  const locationArea = readString(formData, "locationArea");
  const province = readString(formData, "province");
  const cityTown = readString(formData, "cityTown");
  const latitude = readOptionalNumber(formData, "latitude");
  const longitude = readOptionalNumber(formData, "longitude");

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

  if ((latitude === null) !== (longitude === null)) {
    throw new Error("Latitude and longitude must be provided together");
  }

  if (latitude !== null && (latitude < -18 || latitude > 12)) {
    throw new Error("Latitude must be between -18 and 12 for Zambia");
  }

  if (longitude !== null && (longitude < 22 || longitude > 34)) {
    throw new Error("Longitude must be between 22 and 34 for Zambia");
  }

  return {
    title,
    propertyType,
    status: status as ListingStatus,
    priceCents: Math.round(normalizedPrice * 100),
    currency,
    ownerName: ownerName || null,
    address: address || null,
    description: description || null,
    locationArea: locationArea || null,
    province: province || null,
    cityTown: cityTown || null,
    latitude,
    longitude,
  };
}

export async function listContourListings(
  prisma: ContourListingQueryClient,
  limit = 50,
): Promise<ContourListingSummary[]> {
  try {
    const rows = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      where: { deletedAt: null },
      select: contourListingSelect,
    });

    return rows.map(toListingSummary);
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const rows = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      where: { deletedAt: null },
      select: contourListingSelectLegacy,
    });

    return rows.map(toListingSummary);
  }
}

export async function listContourListingsWithDocuments(
  prisma: ContourListingQueryClient,
  limit = 50,
): Promise<ContourListingWithDocuments[]> {
  try {
    const rows = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      where: { deletedAt: null },
      select: {
        ...contourListingSelect,
        documents: {
          orderBy: { createdAt: "desc" },
          where: { deletedAt: null },
          select: contourListingDocumentSelect,
        },
      },
    });

    return rows.map((row) => ({
      ...toListingSummary(row),
      documents: row.documents.map(toListingDocumentSummary),
    }));
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const rows = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      where: { deletedAt: null },
      select: {
        ...contourListingSelectLegacy,
        documents: {
          orderBy: { createdAt: "desc" },
          where: { deletedAt: null },
          select: contourListingDocumentSelect,
        },
      },
    });

    return rows.map((row) => ({
      ...toListingSummary(row),
      documents: row.documents.map(toListingDocumentSummary),
    }));
  }
}

export async function getContourListing(
  prisma: ContourListingQueryClient,
  id: string,
): Promise<ContourListingSummary | null> {
  try {
    const row = await prisma.listing.findUnique({
      where: { id },
      select: contourListingSelect,
    });

    return row ? toListingSummary(row) : null;
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const row = await prisma.listing.findUnique({
      where: { id },
      select: contourListingSelectLegacy,
    });

    return row ? toListingSummary(row) : null;
  }
}

export async function getContourListingWithDocuments(
  prisma: ContourListingQueryClient,
  id: string,
): Promise<ContourListingWithDocuments | null> {
  try {
    const row = await prisma.listing.findUnique({
      where: { id },
      select: {
        ...contourListingSelect,
        documents: {
          orderBy: { createdAt: "desc" },
          where: { deletedAt: null },
          select: contourListingDocumentSelect,
        },
      },
    });

    if (!row) {
      return null;
    }

    return {
      ...toListingSummary(row),
      documents: row.documents.map(toListingDocumentSummary),
    };
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const row = await prisma.listing.findUnique({
      where: { id },
      select: {
        ...contourListingSelectLegacy,
        documents: {
          orderBy: { createdAt: "desc" },
          where: { deletedAt: null },
          select: contourListingDocumentSelect,
        },
      },
    });

    if (!row) {
      return null;
    }

    return {
      ...toListingSummary(row),
      documents: row.documents.map(toListingDocumentSummary),
    };
  }
}

export async function createContourListingAttachment(
  prisma: ContourListingQueryClient,
  input: {
    listingId: string;
    documentName: string;
    blobUrl: string;
    blobKey: string | null;
    mimeType: string | null;
    fileSizeBytes: number | null;
  },
): Promise<ContourListingDocumentSummary> {
  const row = await prisma.document.create({
    data: {
      listingId: input.listingId,
      documentName: input.documentName,
      category: "other" as DocumentCategory,
      blobUrl: input.blobUrl,
      blobKey: input.blobKey,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes == null ? null : BigInt(input.fileSizeBytes),
    },
    select: contourListingDocumentSelect,
  });

  return toListingDocumentSummary(row);
}

export async function createContourListing(
  prisma: ContourListingQueryClient,
  input: ContourListingInput,
): Promise<ContourListingSummary> {
  if (!canUseQueryRaw(prisma)) {
    const row = await prisma.listing.create({
      data: input,
      select: contourListingSelect,
    });

    return toListingSummary(row);
  }

  const hasDescription = await hasListingDescriptionColumn(prisma);
  const data = listingInputData(input, hasDescription);
  const inserted = await prisma.$queryRaw<Array<{ id: string }>>(
    hasDescription
      ? Prisma.sql`
          insert into listings (
            title,
            property_type,
            status,
            price_cents,
            currency,
            owner_name,
            address,
            description,
            location_area,
            province,
            city_town,
            latitude,
            longitude,
            updated_at
          )
          values (
            ${data.title},
            ${data.propertyType},
            ${data.status}::"ListingStatus",
            ${data.priceCents},
            ${data.currency},
            ${data.ownerName ?? null},
            ${data.address ?? null},
            ${data.description ?? null},
            ${data.locationArea ?? null},
            ${data.province ?? null},
            ${data.cityTown ?? null},
            ${data.latitude ?? null},
            ${data.longitude ?? null},
            now()
          )
          returning id
        `
      : Prisma.sql`
          insert into listings (
            title,
            property_type,
            status,
            price_cents,
            currency,
            owner_name,
            address,
            location_area,
            province,
            city_town,
            latitude,
            longitude,
            updated_at
          )
          values (
            ${data.title},
            ${data.propertyType},
            ${data.status}::"ListingStatus",
            ${data.priceCents},
            ${data.currency},
            ${data.ownerName ?? null},
            ${data.address ?? null},
            ${data.locationArea ?? null},
            ${data.province ?? null},
            ${data.cityTown ?? null},
            ${data.latitude ?? null},
            ${data.longitude ?? null},
            now()
          )
          returning id
        `,
  );

  const created = await getContourListing(prisma, inserted[0]?.id ?? "");
  if (!created) {
    throw new Error("Unable to load listing after mutation");
  }

  return created;
}

export async function updateContourListing(
  prisma: ContourListingQueryClient,
  id: string,
  input: ContourListingInput,
): Promise<ContourListingSummary> {
  if (!canUseQueryRaw(prisma)) {
    const row = await prisma.listing.update({
      where: { id },
      data: input,
      select: contourListingSelect,
    });

    return toListingSummary(row);
  }

  const hasDescription = await hasListingDescriptionColumn(prisma);
  const data = listingInputData(input, hasDescription);
  const updated = await prisma.$queryRaw<Array<{ id: string }>>(
    hasDescription
      ? Prisma.sql`
          update listings
          set
            title = ${data.title},
            property_type = ${data.propertyType},
            status = ${data.status}::"ListingStatus",
            price_cents = ${data.priceCents},
            currency = ${data.currency},
            owner_name = ${data.ownerName ?? null},
            address = ${data.address ?? null},
            description = ${data.description ?? null},
            location_area = ${data.locationArea ?? null},
            province = ${data.province ?? null},
            city_town = ${data.cityTown ?? null},
            latitude = ${data.latitude ?? null},
            longitude = ${data.longitude ?? null},
            updated_at = now()
          where id = ${id}::uuid
          returning id
        `
      : Prisma.sql`
          update listings
          set
            title = ${data.title},
            property_type = ${data.propertyType},
            status = ${data.status}::"ListingStatus",
            price_cents = ${data.priceCents},
            currency = ${data.currency},
            owner_name = ${data.ownerName ?? null},
            address = ${data.address ?? null},
            location_area = ${data.locationArea ?? null},
            province = ${data.province ?? null},
            city_town = ${data.cityTown ?? null},
            latitude = ${data.latitude ?? null},
            longitude = ${data.longitude ?? null},
            updated_at = now()
          where id = ${id}::uuid
          returning id
        `,
  );

  const updatedRow = await getContourListing(prisma, updated[0]?.id ?? "");
  if (!updatedRow) {
    throw new Error("Unable to load listing after mutation");
  }

  return updatedRow;
}