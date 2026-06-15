import "../../../../lib/load-contour-env";
import { NextResponse } from "next/server";
import { getPrismaClient, updateContourDeal, type ContourDealStage } from "@contour/db";
import { getDealWorkflow } from "../../../../lib/deal-workflows";

type DealUpdatePayload = {
  title?: string;
  stage?: string;
  status?: string;
  dealType?: string;
  valueCents?: number;
  currency?: string;
  listingId?: string;
  clientId?: string;
  requestSummary?: string;
  preferredPropertyType?: string;
  preferredLocation?: string;
  preferredProvince?: string;
  preferredCityTown?: string;
  preferredBedrooms?: number;
  preferredBathrooms?: number;
};

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumberValue(value: unknown) {
  return typeof value === "number" ? value : Number(value);
}

function toOptionalIntegerValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = toNumberValue(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as DealUpdatePayload;
  const title = toStringValue(body.title);
  const stage = toStringValue(body.stage);
  const status = toStringValue(body.status);
  const dealType = toStringValue(body.dealType) || "sale";
  const currency = toStringValue(body.currency).toUpperCase() || "ZMW";
  const listingId = toStringValue(body.listingId) || null;
  const clientId = toStringValue(body.clientId);
  const valueCents = toNumberValue(body.valueCents);
  const workflow = getDealWorkflow(dealType);
  const requestSummary = toStringValue(body.requestSummary) || null;
  const preferredPropertyType = toStringValue(body.preferredPropertyType) || null;
  const preferredLocation = toStringValue(body.preferredLocation) || null;
  const preferredProvince = toStringValue(body.preferredProvince) || null;
  const preferredCityTown = toStringValue(body.preferredCityTown) || null;
  const preferredBedrooms = toOptionalIntegerValue(body.preferredBedrooms);
  const preferredBathrooms = toOptionalIntegerValue(body.preferredBathrooms);

  if (!title || !stage || !status || !clientId || !Number.isFinite(valueCents)) {
    return NextResponse.json({ error: "Missing required deal fields." }, { status: 400 });
  }

  if (!workflow.stages.some((item) => item.value === stage)) {
    return NextResponse.json({ error: "Invalid deal stage." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const deal = await updateContourDeal(prisma, id, {
    title,
    stage: stage as ContourDealStage,
    status: status as "open" | "won" | "lost",
    dealType: dealType as "sale" | "rental" | "installment",
    valueCents: Math.round(valueCents),
    currency: currency as "ZMW" | "USD",
    listingId,
    clientId,
    requestSummary,
    preferredPropertyType,
    preferredLocation,
    preferredProvince,
    preferredCityTown,
    preferredBedrooms,
    preferredBathrooms,
  });

  return NextResponse.json({ deal });
}
