import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import {
  initiateLencoCollection,
  getPlanPrice,
  CONTOUR_PLANS,
  BillingCycle,
  SupportedCurrency,
  PaymentChannel,
  MobileMoneyOperator,
} from "@/lib/lenco";
import { z } from "zod";

const checkoutSchema = z.object({
  planId: z.enum(["starter", "growth", "enterprise"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
  currency: z.enum(["ZMW", "USD", "ZAR"]).default("ZMW"),
  channel: z.enum(["mobile_money", "card", "bank_transfer"]).default("mobile_money"),
  mobileMoneyOperator: z.enum(["mtn", "airtel", "zamtel"]).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  customerName: z.string().trim().min(2).max(120).optional(),
  customerEmail: z.string().email().optional(),
}).superRefine((value, context) => {
  if (value.channel === "mobile_money" && !value.phone) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "A phone number is required for mobile money." });
  }
});

function paymentResponse(payment: {
  status: string;
  reference: string;
  checkoutUrl: string | null;
  planId: string;
  billingCycle: string;
}) {
  return {
    success: payment.status !== "FAILED",
    status: payment.status,
    reference: payment.reference,
    checkoutUrl: payment.checkoutUrl || undefined,
    planId: payment.planId,
    billingCycle: payment.billingCycle,
    message: payment.status === "SUCCESS"
      ? "Payment completed successfully."
      : payment.status === "PENDING"
        ? "Payment initiated. Complete the authorization request to finish checkout."
        : "Payment failed. Please try again.",
  };
}

const postHandler = createApiHandler({
  bodySchema: checkoutSchema,
  handler: async (req, ctx) => {
    const { organizationId, userId, body, session } = ctx;
    const targetOrgId = organizationId!;
    const idempotencyKey = req.headers.get("idempotency-key")?.trim();

    if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 200) {
      return NextResponse.json(
        { success: false, error: "A unique Idempotency-Key header is required." },
        { status: 400 },
      );
    }

    const existingPayment = await db.payment.findUnique({ where: { idempotencyKey } });
    if (existingPayment) {
      if (existingPayment.organizationId !== targetOrgId) {
        return NextResponse.json({ success: false, error: "Invalid idempotency key." }, { status: 409 });
      }
      return NextResponse.json(paymentResponse(existingPayment));
    }

    const plan = CONTOUR_PLANS[body.planId];
    const billingCycle: BillingCycle = body.billingCycle || "MONTHLY";
    const currency: SupportedCurrency = body.currency || "ZMW";
    const channel: PaymentChannel = body.channel || "mobile_money";

    if (!plan || (currency === "ZAR" && channel === "mobile_money")) {
      return NextResponse.json({ success: false, error: "This payment combination is not supported." }, { status: 400 });
    }

    const priceInfo = getPlanPrice(body.planId, billingCycle, currency);
    const reference = `contour_${targetOrgId}_${Date.now()}_${crypto.randomUUID()}`;
    let payment: Awaited<ReturnType<typeof db.payment.create>>;
    try {
      payment = await db.payment.create({
        data: {
          organizationId: targetOrgId,
          reference,
          idempotencyKey,
          planId: body.planId,
          billingCycle,
          amount: priceInfo.amount,
          currency,
          status: "PENDING",
          metadata: { channel, mobileMoneyOperator: body.mobileMoneyOperator || null },
        },
      });
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        const concurrentPayment = await db.payment.findUnique({ where: { idempotencyKey } });
        if (concurrentPayment && concurrentPayment.organizationId === targetOrgId) {
          return NextResponse.json(paymentResponse(concurrentPayment));
        }
      }
      throw error;
    }

    const collectionResult = await initiateLencoCollection({
      amount: priceInfo.amount,
      currency: currency === "USD" ? "USD" : "ZMW",
      reference,
      narration: `Contour ${plan.name} (${billingCycle}) - ${targetOrgId}`,
      customer: {
        name: body.customerName || session?.user.name || "Contour Broker",
        email: body.customerEmail || session?.user.email || "billing@contour.banyalabs.com",
        phone: body.phone || "",
      },
      channel,
      mobileMoneyOperator: body.mobileMoneyOperator as MobileMoneyOperator | undefined,
      organizationId: targetOrgId,
      planId: body.planId,
      billingCycle,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://contour.banyalabs.com"}/dashboard/billing?ref=${reference}`,
    });

    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: collectionResult.success ? (collectionResult.status === "SUCCESS" ? "SUCCESS" : "PENDING") : "FAILED",
        checkoutUrl: collectionResult.checkoutUrl,
        failureReason: collectionResult.success ? null : collectionResult.message,
        completedAt: collectionResult.status === "SUCCESS" ? new Date() : null,
        metadata: (collectionResult.data || { channel, mobileMoneyOperator: body.mobileMoneyOperator || null }) as Prisma.InputJsonValue,
      },
    });

    if (updatedPayment.status === "SUCCESS") {
      await db.organization.update({
        where: { id: targetOrgId },
        data: {
          subscriptionTier: body.planId.toUpperCase(),
          subscriptionStatus: "active",
          lencoSubscriptionId: reference,
          lencoAccountReference: reference,
        },
      });
      await db.auditLog.create({
        data: {
          organizationId: targetOrgId,
          userId: userId || null,
          action: "LENCO_PAYMENT_COMPLETED",
          entityType: "Payment",
          entityId: payment.id,
          details: { reference, planId: body.planId, billingCycle, amount: priceInfo.amount, currency },
        },
      });
    }

    return NextResponse.json({
      ...paymentResponse(updatedPayment),
      checkoutUrl: collectionResult.checkoutUrl || undefined,
      ussdPromptSent: collectionResult.ussdPromptSent,
      message: collectionResult.message,
    }, { status: updatedPayment.status === "FAILED" ? 502 : 200 });
  },
});

export async function POST(req: NextRequest, context?: unknown) {
  return postHandler(req, context);
}
