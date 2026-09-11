import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyLencoSignature, getLencoTransactionStatus } from "@/lib/lenco";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-lenco-signature") ||
      req.headers.get("lenco-signature") ||
      req.headers.get("x-signature");

    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";
    const webhookSecret = process.env.LENCO_WEBHOOK_SECRET;

    // 1. Signature Verification
    const isSignatureValid = verifyLencoSignature(rawBody, signature);
    if (!isSignatureValid && !isDevMode && webhookSecret && !webhookSecret.includes("placeholder")) {
      console.error("[Lenco Webhook] Invalid webhook signature rejected.");
      return NextResponse.json(
        { success: false, error: "Invalid HMAC SHA-256 signature." },
        { status: 401 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const event = payload.event || payload.type || "transaction.successful";
    const data = payload.data || payload;
    const reference = data.reference;
    const metadata = data.metadata || {};
    const targetOrgId = metadata.organizationId || data.organizationId;
    const planId = metadata.planId || "growth";
    const billingCycle = metadata.billingCycle || "MONTHLY";

    console.log(`[Lenco Webhook Received] Event: ${event}, Ref: ${reference}, Org: ${targetOrgId}`);

    // 2. Handle successful transaction events
    if (
      event === "transaction.successful" ||
      event === "collection.successful" ||
      event === "charge.successful"
    ) {
      if (targetOrgId) {
        await db.organization.update({
          where: { id: targetOrgId },
          data: {
            subscriptionTier: planId.toUpperCase(),
            subscriptionStatus: "active",
            lencoSubscriptionId: reference,
            lencoAccountReference: reference,
          },
        });

        // Record in immutable AuditLog
        await db.auditLog.create({
          data: {
            organizationId: targetOrgId,
            action: "LENCO_PAYMENT_VERIFIED",
            entityType: "Organization",
            entityId: targetOrgId,
            details: {
              event,
              reference,
              amount: data.amount,
              currency: data.currency,
              planId,
              billingCycle,
              source: "LENCO_WEBHOOK",
              verifiedAt: new Date().toISOString(),
            },
          },
        });

        console.log(`[Lenco Webhook] Organization ${targetOrgId} upgraded to ${planId.toUpperCase()} active.`);
      }
    } else if (
      event === "transaction.failed" ||
      event === "collection.failed" ||
      event === "charge.failed"
    ) {
      if (targetOrgId) {
        await db.organization.update({
          where: { id: targetOrgId },
          data: {
            subscriptionStatus: "past_due",
          },
        });

        await db.auditLog.create({
          data: {
            organizationId: targetOrgId,
            action: "LENCO_PAYMENT_FAILED",
            entityType: "Organization",
            entityId: targetOrgId,
            details: {
              event,
              reference,
              failureReason: data.reason || data.message || "Card/MoMo transaction declined",
            },
          },
        });
      }
    }

    return NextResponse.json({ status: "success", received: true });
  } catch (err: any) {
    console.error("[Lenco Webhook Handler Error]:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "Webhook processing error." },
      { status: 500 }
    );
  }
}
