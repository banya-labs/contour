import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getLencoTransactionStatus, verifyLencoSignature } from "@/lib/lenco";
import { commitOrganizationOffer, releaseOrganizationOffer } from "@/lib/billing-offer-reservation";

type JsonRecord = Record<string, unknown>;

const SUCCESS_EVENTS = new Set(["transaction.successful", "collection.successful", "charge.successful"]);
const FAILED_EVENTS = new Set(["transaction.failed", "collection.failed", "charge.failed"]);

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isProviderSuccess(payload: JsonRecord): boolean {
  const nested = asRecord(payload.data);
  const status = asString(payload.status) || asString(nested.status);
  return Boolean(status && ["successful", "success", "completed", "paid"].includes(status.toLowerCase()));
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature =
    req.headers.get("x-lenco-signature") ||
    req.headers.get("lenco-signature") ||
    req.headers.get("x-signature");

  if (!verifyLencoSignature(rawBody, signature)) {
    return NextResponse.json({ success: false, error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: JsonRecord;
  try {
    payload = asRecord(JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const data = asRecord(payload.data);
  const event = asString(payload.event) || asString(payload.type) || "transaction.successful";
  const reference = asString(data.reference) || asString(payload.reference);
  const eventId = req.headers.get("x-lenco-event-id") || asString(payload.id) || asString(data.id);
  const bodyHash = crypto.createHash("sha256").update(rawBody).digest("hex");
  const dedupeKey = eventId ? `lenco:event:${eventId}` : `lenco:body:${bodyHash}`;

  if (!reference) {
    return NextResponse.json({ success: false, error: "Webhook reference is required." }, { status: 400 });
  }

  let webhookEvent = await db.webhookEvent.findUnique({ where: { dedupeKey } });
  if (webhookEvent?.processedAt) {
    return NextResponse.json({ success: true, received: true, duplicate: true });
  }

  if (!webhookEvent) {
    try {
      webhookEvent = await db.webhookEvent.create({
        data: {
          provider: "LENCO",
          dedupeKey,
          eventId: eventId || null,
          eventType: event,
          reference,
          payload: payload as Prisma.InputJsonValue,
        },
      });
    } catch (error: unknown) {
      if (!isUniqueConstraintError(error)) throw error;
      webhookEvent = await db.webhookEvent.findUnique({ where: { dedupeKey } });
      if (!webhookEvent) throw error;
      if (webhookEvent.processedAt) {
        return NextResponse.json({ success: true, received: true, duplicate: true });
      }
    }
  }

  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment) {
    return NextResponse.json({ success: false, error: "Payment reference not found." }, { status: 404 });
  }

  if (SUCCESS_EVENTS.has(event)) {
    const providerStatus = await getLencoTransactionStatus(reference);
    if (!providerStatus || (!isProviderSuccess(providerStatus) && !isProviderSuccess(data))) {
      return NextResponse.json({ success: true, received: true, pendingVerification: true }, { status: 202 });
    }

    let paymentSettled = false;
    await db.$transaction(async (transaction) => {
      const updated = await transaction.payment.updateMany({
        where: { reference, status: { not: "SUCCESS" } },
        data: {
          status: "SUCCESS",
          providerTransactionId: asString(data.transactionId) || asString(data.id),
          completedAt: new Date(),
        },
      });

      if (updated.count > 0) {
        paymentSettled = true;
        await transaction.organization.update({
          where: { id: payment.organizationId },
          data: {
            subscriptionTier: payment.planId.toUpperCase(),
            subscriptionStatus: "active",
            lencoSubscriptionId: reference,
            lencoAccountReference: reference,
          },
        });
        await transaction.auditLog.create({
          data: {
            organizationId: payment.organizationId,
            action: "LENCO_PAYMENT_VERIFIED",
            entityType: "Payment",
            entityId: payment.id,
            details: { event, reference, source: "LENCO_WEBHOOK", verifiedAt: new Date().toISOString() },
          },
        });
      }

      await transaction.webhookEvent.update({ where: { id: webhookEvent!.id }, data: { processedAt: new Date() } });
    });
    if (paymentSettled) await commitOrganizationOffer(payment.id);
  } else if (FAILED_EVENTS.has(event)) {
    await db.$transaction(async (transaction) => {
      await transaction.payment.updateMany({
        where: { reference, status: { not: "SUCCESS" } },
        data: {
          status: "FAILED",
          failureReason: asString(data.reason) || asString(data.message) || "Lenco payment failed",
        },
      });
      await transaction.webhookEvent.update({ where: { id: webhookEvent!.id }, data: { processedAt: new Date() } });
    });
    await releaseOrganizationOffer(payment.id);
  } else {
    await db.webhookEvent.update({ where: { id: webhookEvent.id }, data: { processedAt: new Date() } });
  }

  return NextResponse.json({ success: true, received: true });
}
