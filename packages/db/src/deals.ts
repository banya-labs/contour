import { Prisma, type PrismaClient } from "@prisma/client";

type CurrencyCode = "ZMW" | "USD";
export type ContourDealStage =
  | "new_enquiry"
  | "qualified"
  | "site_visit"
  | "offer_made"
  | "negotiating"
  | "document_check"
  | "closing"
  | "won"
  | "lost";

export type ContourDealStatus = "open" | "won" | "lost";
export type ContourDealType = "sale" | "rental" | "installment";

type ContourDealQueryRow = {
  id: string;
  title: string;
  stage: string;
  status: string;
  dealType: string | null;
  valueCents: number;
  currency: string;
  closedAt: Date | null;
  listingId: string | null;
  clientId: string | null;
  requestSummary: string | null;
  preferredPropertyType: string | null;
  preferredLocation: string | null;
  preferredProvince: string | null;
  preferredCityTown: string | null;
  preferredBedrooms: number | null;
  preferredBathrooms: number | null;
  createdAt: Date;
  updatedAt: Date;
  listingRecordId: string | null;
  listingTitle: string | null;
  listingDescription: string | null;
  clientRecordId: string | null;
  clientFullName: string | null;
  paymentPlansCount: number;
  paymentsCount: number;
};

function isMissingColumnError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("42703") || error.message.includes("does not exist");
}

export type ContourDealSummary = {
  id: string;
  title: string;
  stage: ContourDealStage;
  status: ContourDealStatus;
  dealType: ContourDealType | null;
  valueCents: number;
  currency: string;
  closedAt: string | null;
  listingId: string | null;
  clientId: string | null;
  requestSummary: string | null;
  preferredPropertyType: string | null;
  preferredLocation: string | null;
  preferredProvince: string | null;
  preferredCityTown: string | null;
  preferredBedrooms: number | null;
  preferredBathrooms: number | null;
  listing: { id: string; title: string } | null;
  client: { id: string; fullName: string } | null;
  paymentPlansCount: number;
  paymentsCount: number;
  createdAt: string;
  updatedAt: string;
  listingDescription: string | null;
};

export type ContourDealInput = {
  title: string;
  stage: ContourDealStage;
  status: ContourDealStatus;
  dealType: ContourDealType;
  valueCents: number;
  currency: CurrencyCode;
  listingId: string | null;
  clientId: string;
  requestSummary?: string | null;
  preferredPropertyType?: string | null;
  preferredLocation?: string | null;
  preferredProvince?: string | null;
  preferredCityTown?: string | null;
  preferredBedrooms?: number | null;
  preferredBathrooms?: number | null;
};

const validDealStages: ContourDealStage[] = [
  "new_enquiry",
  "qualified",
  "site_visit",
  "offer_made",
  "negotiating",
  "document_check",
  "closing",
  "won",
  "lost",
];

const validDealStatuses: ContourDealStatus[] = ["open", "won", "lost"];
const validDealTypes: ContourDealType[] = ["sale", "rental", "installment"];
const validCurrencies: CurrencyCode[] = ["ZMW", "USD"];

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalInteger(formData: FormData, key: string) {
  const value = readString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${key} must be a whole number`);
  }

  return parsed;
}

function toDealSummary(deal: ContourDealQueryRow): ContourDealSummary {
  return {
    id: deal.id,
    title: deal.title,
    stage: deal.stage as ContourDealStage,
    status: deal.status as ContourDealStatus,
    dealType: (deal.dealType as ContourDealType | null) ?? null,
    valueCents: deal.valueCents,
    currency: deal.currency,
    closedAt: deal.closedAt ? deal.closedAt.toISOString() : null,
    listingId: deal.listingId,
    clientId: deal.clientId,
    requestSummary: deal.requestSummary,
    preferredPropertyType: deal.preferredPropertyType,
    preferredLocation: deal.preferredLocation,
    preferredProvince: deal.preferredProvince,
    preferredCityTown: deal.preferredCityTown,
    preferredBedrooms: deal.preferredBedrooms,
    preferredBathrooms: deal.preferredBathrooms,
    listing: deal.listingRecordId
      ? { id: deal.listingRecordId, title: deal.listingTitle ?? "Untitled listing" }
      : null,
    client: deal.clientRecordId
      ? { id: deal.clientRecordId, fullName: deal.clientFullName ?? "Unnamed client" }
      : null,
    listingDescription: deal.listingDescription,
    paymentPlansCount: deal.paymentPlansCount,
    paymentsCount: deal.paymentsCount,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  };
}

function dealSelectSql(
  alias = "d",
  options: { includeRequestFields?: boolean; includeListingDescription?: boolean } = {},
) {
  const { includeRequestFields = true, includeListingDescription = true } = options;

  return Prisma.sql`
    select
      ${Prisma.raw(alias)}.id,
      ${Prisma.raw(alias)}.title,
      ${Prisma.raw(alias)}.stage::text as stage,
      ${Prisma.raw(alias)}.status::text as status,
      ${Prisma.raw(alias)}.deal_type::text as "dealType",
      ${Prisma.raw(alias)}.value_cents as "valueCents",
      ${Prisma.raw(alias)}.currency,
      ${Prisma.raw(alias)}.closed_at as "closedAt",
      ${Prisma.raw(alias)}.listing_id as "listingId",
      ${Prisma.raw(alias)}.client_id as "clientId",
      ${
        includeRequestFields
          ? Prisma.sql`
              ${Prisma.raw(alias)}.request_summary as "requestSummary",
              ${Prisma.raw(alias)}.preferred_property_type as "preferredPropertyType",
              ${Prisma.raw(alias)}.preferred_location as "preferredLocation",
              ${Prisma.raw(alias)}.preferred_province as "preferredProvince",
              ${Prisma.raw(alias)}.preferred_city_town as "preferredCityTown",
              ${Prisma.raw(alias)}.preferred_bedrooms as "preferredBedrooms",
              ${Prisma.raw(alias)}.preferred_bathrooms as "preferredBathrooms",
            `
          : Prisma.sql`
              null::text as "requestSummary",
              null::text as "preferredPropertyType",
              null::text as "preferredLocation",
              null::text as "preferredProvince",
              null::text as "preferredCityTown",
              null::int as "preferredBedrooms",
              null::int as "preferredBathrooms",
            `
      }
      ${Prisma.raw(alias)}.created_at as "createdAt",
      ${Prisma.raw(alias)}.updated_at as "updatedAt",
      l.id as "listingRecordId",
      l.title as "listingTitle",
      ${includeListingDescription ? Prisma.sql`l.description as "listingDescription",` : Prisma.sql`null::text as "listingDescription",`}
      c.id as "clientRecordId",
      c.full_name as "clientFullName",
      coalesce((select count(*)::int from payment_plans pp where pp.deal_id = ${Prisma.raw(alias)}.id), 0) as "paymentPlansCount",
      coalesce((select count(*)::int from payments p where p.deal_id = ${Prisma.raw(alias)}.id), 0) as "paymentsCount"
    from deals ${Prisma.raw(alias)}
    left join listings l on l.id = ${Prisma.raw(alias)}.listing_id
    left join clients c on c.id = ${Prisma.raw(alias)}.client_id
  `;
}

function dealSelectSqlLegacy(alias = "d") {
  return dealSelectSql(alias, { includeRequestFields: false, includeListingDescription: false });
}

export function parseContourDealFormData(formData: FormData): ContourDealInput {
  const title = readString(formData, "title");
  const stage = readString(formData, "stage");
  const status = readString(formData, "status");
  const dealType = readString(formData, "dealType") || "sale";
  const value = readString(formData, "value");
  const currency = readString(formData, "currency").toUpperCase() || "ZMW";
  const listingId = readString(formData, "listingId") || null;
  const clientId = readString(formData, "clientId");
  const requestSummary = readString(formData, "requestSummary");
  const preferredPropertyType = readString(formData, "preferredPropertyType");
  const preferredLocation = readString(formData, "preferredLocation");
  const preferredProvince = readString(formData, "preferredProvince");
  const preferredCityTown = readString(formData, "preferredCityTown");
  const preferredBedrooms = readOptionalInteger(formData, "preferredBedrooms");
  const preferredBathrooms = readOptionalInteger(formData, "preferredBathrooms");

  if (!title) {
    throw new Error("Deal title is required");
  }
  if (!stage) {
    throw new Error("Deal stage is required");
  }
  if (!status) {
    throw new Error("Deal status is required");
  }
  if (!dealType) {
    throw new Error("Deal type is required");
  }
  if (!value) {
    throw new Error("Deal value is required");
  }
  if (!clientId) {
    throw new Error("Linked client is required");
  }

  const normalizedValue = Number(value);
  if (!Number.isFinite(normalizedValue)) {
    throw new Error("Deal value must be a number");
  }
  if (!validDealStages.includes(stage as ContourDealStage)) {
    throw new Error("Deal stage is invalid");
  }
  if (!validDealStatuses.includes(status as ContourDealStatus)) {
    throw new Error("Deal status is invalid");
  }
  if (!validDealTypes.includes(dealType as ContourDealType)) {
    throw new Error("Deal type is invalid");
  }
  if (!validCurrencies.includes(currency as CurrencyCode)) {
    throw new Error("Deal currency is invalid");
  }
  if (normalizedValue <= 0) {
    throw new Error("Deal value must be greater than zero");
  }

  return {
    title,
    stage: stage as ContourDealStage,
    status: status as ContourDealStatus,
    dealType: dealType as ContourDealType,
    valueCents: Math.round(normalizedValue * 100),
    currency: currency as CurrencyCode,
    listingId,
    clientId,
    requestSummary: requestSummary || null,
    preferredPropertyType: preferredPropertyType || null,
    preferredLocation: preferredLocation || null,
    preferredProvince: preferredProvince || null,
    preferredCityTown: preferredCityTown || null,
    preferredBedrooms,
    preferredBathrooms,
  };
}

export async function listContourDeals(
  prisma: PrismaClient,
  options: { limit?: number; dealType?: ContourDealType } = {},
): Promise<ContourDealSummary[]> {
  const buildQuery = (selectSql: Prisma.Sql) =>
    Prisma.sql`${selectSql}
      ${options.dealType ? Prisma.sql`where d.deal_type = ${options.dealType}::"CanonicalDealType"` : Prisma.empty}
      order by d.created_at desc
      ${options.limit ? Prisma.sql`limit ${options.limit}` : Prisma.empty}
    `;

  try {
    const rows = await prisma.$queryRaw<ContourDealQueryRow[]>(buildQuery(dealSelectSql()));
    return rows.map(toDealSummary);
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const rows = await prisma.$queryRaw<ContourDealQueryRow[]>(buildQuery(dealSelectSqlLegacy()));
    return rows.map(toDealSummary);
  }
}

export async function getContourDeal(
  prisma: PrismaClient,
  id: string,
): Promise<ContourDealSummary | null> {
  const buildQuery = (selectSql: Prisma.Sql) =>
    Prisma.sql`${selectSql}
      where d.id = ${id}::uuid
      limit 1
    `;

  try {
    const rows = await prisma.$queryRaw<ContourDealQueryRow[]>(buildQuery(dealSelectSql()));
    return rows[0] ? toDealSummary(rows[0]) : null;
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const rows = await prisma.$queryRaw<ContourDealQueryRow[]>(buildQuery(dealSelectSqlLegacy()));
    return rows[0] ? toDealSummary(rows[0]) : null;
  }
}

async function fetchDealByMutation(
  prisma: PrismaClient,
  mutationSql: Prisma.Sql,
): Promise<ContourDealSummary> {
  const rows = await prisma.$queryRaw<ContourDealQueryRow[]>(mutationSql);
  const row = rows[0];

  if (!row) {
    throw new Error("Unable to load deal after mutation");
  }

  return toDealSummary(row);
}

export async function createContourDeal(
  prisma: PrismaClient,
  input: ContourDealInput,
): Promise<ContourDealSummary> {
  const legacyInsertSql = Prisma.sql`
    with inserted as (
      insert into deals (
        title,
        stage,
        status,
        deal_type,
        value_cents,
        currency,
        listing_id,
        client_id
      )
      values (
        ${input.title},
        ${input.stage}::"DealStage",
        ${input.status}::"DealStatus",
        ${input.dealType}::"CanonicalDealType",
        ${input.valueCents},
        ${input.currency},
        ${input.listingId ? Prisma.sql`${input.listingId}::uuid` : Prisma.sql`null`},
        ${input.clientId}::uuid
      )
      returning *
    )
    ${dealSelectSqlLegacy("inserted")}
    limit 1
  `;

  try {
    return await fetchDealByMutation(
      prisma,
      Prisma.sql`
        with inserted as (
          insert into deals (
            title,
            stage,
            status,
            deal_type,
            value_cents,
            currency,
            listing_id,
            client_id,
            request_summary,
            preferred_property_type,
            preferred_location,
            preferred_province,
            preferred_city_town,
            preferred_bedrooms,
            preferred_bathrooms
          )
          values (
            ${input.title},
            ${input.stage}::"DealStage",
            ${input.status}::"DealStatus",
            ${input.dealType}::"CanonicalDealType",
            ${input.valueCents},
            ${input.currency},
            ${input.listingId ? Prisma.sql`${input.listingId}::uuid` : Prisma.sql`null`},
            ${input.clientId}::uuid,
            ${input.requestSummary ?? null},
            ${input.preferredPropertyType ?? null},
            ${input.preferredLocation ?? null},
            ${input.preferredProvince ?? null},
            ${input.preferredCityTown ?? null},
            ${input.preferredBedrooms ?? null},
            ${input.preferredBathrooms ?? null}
          )
          returning *
        )
        ${dealSelectSql("inserted")}
        limit 1
      `,
    );
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    return fetchDealByMutation(prisma, legacyInsertSql);
  }
}

export async function updateContourDeal(
  prisma: PrismaClient,
  id: string,
  input: ContourDealInput,
): Promise<ContourDealSummary> {
  const legacyUpdateSql = Prisma.sql`
    with updated as (
      update deals
      set
        title = ${input.title},
        stage = ${input.stage}::"DealStage",
        status = ${input.status}::"DealStatus",
        deal_type = ${input.dealType}::"CanonicalDealType",
        value_cents = ${input.valueCents},
        currency = ${input.currency},
        listing_id = ${input.listingId ? Prisma.sql`${input.listingId}::uuid` : Prisma.sql`null`},
        client_id = ${input.clientId}::uuid
      where id = ${id}::uuid
      returning *
    )
    ${dealSelectSqlLegacy("updated")}
    limit 1
  `;

  try {
    return await fetchDealByMutation(
      prisma,
      Prisma.sql`
        with updated as (
          update deals
          set
            title = ${input.title},
            stage = ${input.stage}::"DealStage",
            status = ${input.status}::"DealStatus",
            deal_type = ${input.dealType}::"CanonicalDealType",
            value_cents = ${input.valueCents},
            currency = ${input.currency},
            listing_id = ${input.listingId ? Prisma.sql`${input.listingId}::uuid` : Prisma.sql`null`},
            client_id = ${input.clientId}::uuid,
            request_summary = ${input.requestSummary ?? null},
            preferred_property_type = ${input.preferredPropertyType ?? null},
            preferred_location = ${input.preferredLocation ?? null},
            preferred_province = ${input.preferredProvince ?? null},
            preferred_city_town = ${input.preferredCityTown ?? null},
            preferred_bedrooms = ${input.preferredBedrooms ?? null},
            preferred_bathrooms = ${input.preferredBathrooms ?? null}
          where id = ${id}::uuid
          returning *
        )
        ${dealSelectSql("updated")}
        limit 1
      `,
    );
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    return fetchDealByMutation(prisma, legacyUpdateSql);
  }
}

function normalizeMatchText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function containsMatch(haystack: string, needle: string) {
  return haystack.includes(needle) || needle.includes(haystack);
}

export type ContourListingMatch = {
  listing: {
    id: string;
    title: string;
    propertyType: string;
    description: string | null;
    priceCents: number;
    currency: string;
    address: string | null;
    locationArea: string | null;
    province: string | null;
    cityTown: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
  };
  score: number;
  reasons: string[];
};

export function scoreContourListingMatch(
  deal: Pick<
    ContourDealSummary,
    | "requestSummary"
    | "valueCents"
    | "preferredPropertyType"
    | "preferredLocation"
    | "preferredProvince"
    | "preferredCityTown"
    | "preferredBedrooms"
    | "preferredBathrooms"
  >,
  listing: {
    id: string;
    title: string;
    propertyType: string;
    description: string | null;
    priceCents: number;
    currency: string;
    address: string | null;
    locationArea: string | null;
    province: string | null;
    cityTown: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
  },
): ContourListingMatch | null {
  const reasons: string[] = [];
  let score = 0;
  let hasSpecMatch = false;
  const listingText = normalizeMatchText(
    [
      listing.title,
      listing.description,
      listing.address,
      listing.locationArea,
      listing.province,
      listing.cityTown,
      listing.propertyType,
    ]
      .filter(Boolean)
      .join(" "),
  );
  const requestSummaryTokens = normalizeMatchText(deal.requestSummary)
    .split(" ")
    .filter((token) => token.length > 2);

  if (requestSummaryTokens.length && requestSummaryTokens.some((token) => containsMatch(listingText, token))) {
    score += 20;
    hasSpecMatch = true;
    reasons.push("Request summary matches the property description");
  }

  const preferredPropertyType = normalizeMatchText(deal.preferredPropertyType);
  if (preferredPropertyType) {
    const listingPropertyType = normalizeMatchText(listing.propertyType);
    if (containsMatch(listingPropertyType, preferredPropertyType)) {
      score += 25;
      hasSpecMatch = true;
      reasons.push(`Property type matches ${deal.preferredPropertyType}`);
    }
  }

  const preferredLocationTokens = [
    deal.preferredLocation,
    deal.preferredProvince,
    deal.preferredCityTown,
  ]
    .map(normalizeMatchText)
    .filter(Boolean);

  if (preferredLocationTokens.length) {
    if (preferredLocationTokens.some((token) => containsMatch(listingText, token))) {
      score += 25;
      hasSpecMatch = true;
      reasons.push("Location matches the request");
    }
  }

  if (deal.valueCents > 0 && listing.priceCents <= deal.valueCents) {
    score += 20;
    reasons.push("Price is within budget");
  }

  if (
    deal.preferredBedrooms !== null &&
    listing.bedrooms !== undefined &&
    listing.bedrooms !== null &&
    listing.bedrooms >= deal.preferredBedrooms
  ) {
    score += 10;
    hasSpecMatch = true;
    reasons.push(`Bedrooms meet the request (${listing.bedrooms})`);
  } else if (deal.preferredBedrooms !== null && containsMatch(listingText, `${deal.preferredBedrooms} bedroom`)) {
    score += 10;
    hasSpecMatch = true;
    reasons.push(`Bedrooms match the request (${deal.preferredBedrooms})`);
  }

  if (
    deal.preferredBathrooms !== null &&
    listing.bathrooms !== undefined &&
    listing.bathrooms !== null &&
    listing.bathrooms >= deal.preferredBathrooms
  ) {
    score += 10;
    hasSpecMatch = true;
    reasons.push(`Bathrooms meet the request (${listing.bathrooms})`);
  } else if (deal.preferredBathrooms !== null && containsMatch(listingText, `${deal.preferredBathrooms} bathroom`)) {
    score += 10;
    hasSpecMatch = true;
    reasons.push(`Bathrooms match the request (${deal.preferredBathrooms})`);
  }

  if (!score || !hasSpecMatch) {
    return null;
  }

  return {
    listing,
    score,
    reasons,
  };
}

export function findContourListingMatchesForDeal(
  deal: Pick<
    ContourDealSummary,
    | "requestSummary"
    | "valueCents"
    | "preferredPropertyType"
    | "preferredLocation"
    | "preferredProvince"
    | "preferredCityTown"
    | "preferredBedrooms"
    | "preferredBathrooms"
  >,
  listings: Array<ContourListingMatch["listing"]>,
  limit = 5,
): ContourListingMatch[] {
  return listings
    .map((listing) => scoreContourListingMatch(deal, listing))
    .filter((match): match is ContourListingMatch => Boolean(match))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
