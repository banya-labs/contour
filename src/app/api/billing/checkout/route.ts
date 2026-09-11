import { NextRequest, NextResponse } from "next/server";
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
  phone: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
});

const postHandler = createApiHandler({
  bodySchema: checkoutSchema,
  handler: async (req, ctx) => {
    const { organizationId, userId, body, session } = ctx;
    const targetOrgId = organizationId || "org_contour_demo";

    const planId = body.planId;
    const billingCycle: BillingCycle = body.billingCycle || "MONTHLY";
    const currency: SupportedCurrency = (body.currency as SupportedCurrency) || "ZMW";
    const channel: PaymentChannel = (body.channel as PaymentChannel) || "mobile_money";
    const mobileMoneyOperator = body.mobileMoneyOperator;
    const phone = body.phone;
    const customerName = body.customerName;
    const customerEmail = body.customerEmail;

    const plan = CONTOUR_PLANS[planId];
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription plan selected." },
        { status: 400 }
      );
    }

    const priceInfo = getPlanPrice(planId, billingCycle, currency as SupportedCurrency);
    const reference = `contour_${planId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const narration = `Contour ${plan.name} (${billingCycle}) - ${targetOrgId}`;

    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";
    const apiKey = process.env.LENCO_API_KEY;

    // 1. Dev Mode or Unconfigured Gateway: Instant Activation Simulation
    if (isDevMode || !apiKey || apiKey.includes("placeholder")) {
      try {
        await db.organization.update({
          where: { id: targetOrgId },
          data: {
            subscriptionTier: planId.toUpperCase(),
            subscriptionStatus: "active",
            lencoSubscriptionId: reference,
            lencoAccountReference: `dev_ref_${Date.now()}`,
          },
        });

        // Record in audit log
        await db.auditLog.create({
          data: {
            organizationId: targetOrgId,
            userId: userId || null,
            action: "SUBSCRIPTION_UPGRADED_DEV_BYPASS",
            entityType: "Organization",
            entityId: targetOrgId,
            details: {
              planId,
              billingCycle,
              price: priceInfo.formatted,
              gateway: "LENCO_DEV_BYPASS",
              reference,
            },
          },
        });
      } catch (err: any) {
        console.warn("[Billing Checkout] DB update skipped in mock mode:", err.message);
      }

      return NextResponse.json({
        success: true,
        status: "SUCCESS",
        reference,
        message: `Successfully upgraded to ${plan.name} (${priceInfo.formatted}/${billingCycle.toLowerCase()})!`,
        plan: plan.name,
        price: priceInfo.formatted,
        billingCycle,
        simulated: true,
      });
    }

    // 2. Production Mode: Initiate Lenco Collection Request
    const collectionResult = await initiateLencoCollection({
      amount: priceInfo.amount,
      currency: currency === "USD" ? "USD" : "ZMW",
      reference,
      narration,
      customer: {
        name: customerName || session?.user?.name || "Contour Broker",
        email: customerEmail || session?.user?.email || "billing@contour.app",
        phone: phone || "+260970000000",
      },
      channel: channel as PaymentChannel,
      mobileMoneyOperator: mobileMoneyOperator as MobileMoneyOperator,
      organizationId: targetOrgId,
      planId,
      billingCycle: billingCycle as BillingCycle,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://contour.banyalabs.com"}/dashboard/billing?ref=${reference}`,
    });

    if (!collectionResult.success) {
      return NextResponse.json(
        { success: false, error: collectionResult.message, details: collectionResult.data },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: collectionResult.status,
      reference,
      checkoutUrl: collectionResult.checkoutUrl,
      ussdPromptSent: collectionResult.ussdPromptSent,
      message: collectionResult.message,
    });
  },
});

export async function POST(req: NextRequest, context?: any) {
  return postHandler(req, context);
}
