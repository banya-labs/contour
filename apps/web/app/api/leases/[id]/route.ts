import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getPrismaClient } from "@contour/db";
import { getLeaseStatusForStage, leaseWorkflow } from "../../../../lib/lease-workflows";
import type { LeaseStageValue } from "../../../../lib/lease-workflows";

const validLeaseStages = new Set(leaseWorkflow.stages.map((stage) => stage.value));

interface LeaseUpdatePayload {
  leaseName?: unknown;
  leaseStage?: unknown;
  status?: unknown;
  rentAmount?: unknown;
  currency?: unknown;
  billingDay?: unknown;
  depositAmount?: unknown;
  listingId?: unknown;
  tenantClientId?: unknown;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = (await request.json()) as LeaseUpdatePayload;
  const leaseName = String(payload.leaseName ?? "").trim();
  const leaseStage = String(payload.leaseStage ?? "").trim();
  const status = String(payload.status ?? "").trim();
  const rentAmount = Number(payload.rentAmount);
  const currency = String(payload.currency ?? "").trim().toUpperCase();
  const billingDay = Number(payload.billingDay);
  const depositAmount = String(payload.depositAmount ?? "").trim();
  const listingId = String(payload.listingId ?? "").trim();
  const tenantClientId = String(payload.tenantClientId ?? "").trim();

  if (!leaseName) {
    return new NextResponse("Lease name is required", { status: 400 });
  }
  if (!validLeaseStages.has(leaseStage as LeaseStageValue)) {
    return new NextResponse("Lease stage is invalid", { status: 400 });
  }
  if (!['active', 'ended'].includes(status)) {
    return new NextResponse("Lease status is invalid", { status: 400 });
  }
  if (!Number.isFinite(rentAmount) || rentAmount <= 0) {
    return new NextResponse("Lease rent must be greater than zero", { status: 400 });
  }
  if (!["ZMW", "USD"].includes(currency)) {
    return new NextResponse("Lease currency is invalid", { status: 400 });
  }
  if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 28) {
    return new NextResponse("Billing day must be between 1 and 28", { status: 400 });
  }
  if (!listingId) {
    return new NextResponse("Linked listing is required", { status: 400 });
  }
  if (!tenantClientId) {
    return new NextResponse("Linked tenant is required", { status: 400 });
  }

  const normalizedLeaseStage = leaseStage as LeaseStageValue;
  const prisma = getPrismaClient();
  const existingLease = await prisma.rentalLease.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingLease) {
    return new NextResponse("Lease not found", { status: 404 });
  }

  await prisma.rentalLease.update({
    where: { id },
    data: {
      leaseName,
      leaseStage: normalizedLeaseStage,
      status: status === "ended" ? "ended" : getLeaseStatusForStage(normalizedLeaseStage),
      rentAmount,
      currency: currency as "ZMW" | "USD",
      billingDay,
      depositAmount: depositAmount ? depositAmount : null,
      listingId,
      tenantClientId,
    },
  });

  revalidateTag("contour-finance-leases-page-data", "max");
  revalidateTag("contour-finance-page-data", "max");

  const lease = await prisma.rentalLease.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true } },
      tenantClient: { select: { id: true, fullName: true } },
      rentalCharges: { select: { id: true } },
    },
  });

  if (!lease) {
    return new NextResponse("Lease not found after update", { status: 404 });
  }

  return NextResponse.json({
    lease: {
      id: lease.id,
      leaseName: lease.leaseName,
      leaseStage: lease.leaseStage,
      status: lease.status,
      rentAmount: Number(lease.rentAmount),
      currency: lease.currency,
      billingDay: lease.billingDay,
      depositAmount: lease.depositAmount == null ? null : Number(lease.depositAmount),
      listing: lease.listing ? { id: lease.listing.id, title: lease.listing.title } : null,
      tenantClient: lease.tenantClient ? { id: lease.tenantClient.id, fullName: lease.tenantClient.fullName } : null,
      rentalChargesCount: lease.rentalCharges.length,
    },
  });
}
