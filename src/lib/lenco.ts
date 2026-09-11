/**
 * Lenco Zambia Payment Gateway & Subscription Integration for Contour
 * Official Gateway: https://lenco.co/zm (Broadpay Zambia / Lenco API: https://docs.lenco.co)
 * Supports:
 * - Zambian Kwacha (ZMW) & US Dollars (USD)
 * - Mobile Money: MTN MoMo, Airtel Money, Zamtel Kwacha
 * - Cards: Visa & Mastercard
 * - Bank Wire & Virtual Account Settlement
 */

import crypto from "crypto";

export type BillingCycle = "MONTHLY" | "ANNUAL";
export type SupportedCurrency = "ZMW" | "USD" | "ZAR";
export type MobileMoneyOperator = "mtn" | "airtel" | "zamtel";
export type PaymentChannel = "mobile_money" | "card" | "bank_transfer";

export interface PlanConfig {
  id: "starter" | "growth" | "enterprise";
  name: string;
  badge: string;
  description: string;
  monthlyZmw: number;
  annualZmw: number;
  monthlyUsd: number;
  annualUsd: number;
  maxAgents: number;
  maxListings: number;
  maxRentalUnits: number;
  features: string[];
}

export const CONTOUR_PLANS: Record<string, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Starter Broker",
    badge: "Boutique & Solo",
    description: "For boutique agencies & solo principals (1–3 agents).",
    monthlyZmw: 1200,
    annualZmw: 960,
    monthlyUsd: 49,
    annualUsd: 39,
    maxAgents: 3,
    maxListings: 50,
    maxRentalUnits: 20,
    features: [
      "Up to 50 active listings",
      "20 managed rental units",
      "Interactive Lusaka Leaflet property map",
      "1-Click WhatsApp listing flyer generator",
      "30-Day anti-poaching client registration",
      "Public shareable property cards (/p/[slug])",
      "Lenco Mobile Money (MTN, Airtel, Zamtel) & Card billing",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth Agency",
    badge: "Most Popular ⭐ (MAL's Tier)",
    description: "For scaling mid-sized brokerages (4–15 agents).",
    monthlyZmw: 3200,
    annualZmw: 2560,
    monthlyUsd: 129,
    annualUsd: 99,
    maxAgents: 15,
    maxListings: 250,
    maxRentalUnits: 100,
    features: [
      "Up to 250 active listings & 100 rental units",
      "True 5% Commission & Agent Split Ledger",
      "1-Click Landlord Remittance Statements",
      "The DocuSign Human Approval Seam",
      "PowerSync Offline-First Field PWA (/kiosk)",
      "Automated WhatsApp rent arrears bot",
      "Public REST API for Corporate Website listings",
      "Reverse Matchmaker buyer-to-property AI alerts",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Brokerage",
    badge: "Multi-Branch",
    description: "For multi-branch firms & commercial developers.",
    monthlyZmw: 7500,
    annualZmw: 6000,
    monthlyUsd: 299,
    annualUsd: 239,
    maxAgents: 999,
    maxListings: 9999,
    maxRentalUnits: 9999,
    features: [
      "Unlimited listings, agents & rental units",
      "Multi-branch RBAC (Lusaka, Ndola, Livingstone)",
      "WhatsApp Voice note ingestion & transcription",
      "Custom domain & white-labeled Field PWA",
      "Dedicated MinIO S3 object storage partition",
      "Full JSON-RPC 2.0 /api/mcp AI agent tools",
      "Unlimited public API keys & custom webhooks",
      "Dedicated SLA & technical account architect",
    ],
  },
};

/**
 * Gets the localized price for a plan
 */
export function getPlanPrice(
  planId: "starter" | "growth" | "enterprise",
  cycle: BillingCycle,
  currency: SupportedCurrency
): { amount: number; formatted: string } {
  const plan = CONTOUR_PLANS[planId];
  if (!plan) return { amount: 0, formatted: "0" };

  let amount = 0;
  if (currency === "USD") {
    amount = cycle === "ANNUAL" ? plan.annualUsd : plan.monthlyUsd;
    return { amount, formatted: `$ ${amount.toLocaleString("en-US")}` };
  } else if (currency === "ZAR") {
    const zarMultiplier = 18.5; // Approximate peg
    amount = Math.round((cycle === "ANNUAL" ? plan.annualUsd : plan.monthlyUsd) * zarMultiplier);
    return { amount, formatted: `R ${amount.toLocaleString("en-US")}` };
  } else {
    // Default ZMW (Zambian Kwacha)
    amount = cycle === "ANNUAL" ? plan.annualZmw : plan.monthlyZmw;
    return { amount, formatted: `K ${amount.toLocaleString("en-US")}` };
  }
}

/**
 * Verifies incoming Lenco webhook HMAC SHA-256 signature
 */
export function verifyLencoSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LENCO_WEBHOOK_SECRET || "dev_lenco_webhook_secret";
  if (!signature) return false;

  const hash = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return hash.toLowerCase() === signature.toLowerCase();
}

export interface LencoCollectionPayload {
  amount: number;
  currency: "ZMW" | "USD";
  reference: string;
  narration: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  channel: PaymentChannel;
  mobileMoneyOperator?: MobileMoneyOperator;
  organizationId: string;
  planId: string;
  billingCycle: BillingCycle;
  callbackUrl?: string;
}

export interface LencoCollectionResult {
  success: boolean;
  status: "PENDING_AUTHORIZATION" | "SUCCESS" | "FAILED";
  reference: string;
  checkoutUrl?: string;
  ussdPromptSent?: boolean;
  message: string;
  data?: any;
}

/**
 * Initiates a Lenco collection (Mobile Money USSD push or Card Checkout link)
 */
export async function initiateLencoCollection(
  payload: LencoCollectionPayload
): Promise<LencoCollectionResult> {
  const apiKey = process.env.LENCO_API_KEY;
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";
  const apiUrl = process.env.LENCO_API_URL || "https://api.lenco.co";

  // Dev mode or missing API key fallback
  if (isDevMode || !apiKey || apiKey.includes("placeholder")) {
    return {
      success: true,
      status: "SUCCESS",
      reference: payload.reference,
      message: `[Dev Mode Simulated] Lenco collection of ${payload.currency} ${payload.amount.toLocaleString()} approved instantly for ${payload.customer.name}.`,
      data: {
        simulated: true,
        channel: payload.channel,
        operator: payload.mobileMoneyOperator,
        reference: payload.reference,
      },
    };
  }

  try {
    const endpoint =
      payload.channel === "mobile_money"
        ? `${apiUrl}/v1/collections/mobile-money`
        : `${apiUrl}/v1/collections/card`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount: payload.amount,
        currency: payload.currency,
        reference: payload.reference,
        narration: payload.narration,
        phone: payload.customer.phone,
        operator: payload.mobileMoneyOperator || "mtn",
        customer: {
          name: payload.customer.name,
          email: payload.customer.email,
          phone: payload.customer.phone,
        },
        metadata: {
          organizationId: payload.organizationId,
          planId: payload.planId,
          billingCycle: payload.billingCycle,
        },
        callback_url: payload.callbackUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        status: "FAILED",
        reference: payload.reference,
        message: data.message || `Lenco API error: HTTP ${response.status}`,
        data,
      };
    }

    return {
      success: true,
      status: data.status === "successful" ? "SUCCESS" : "PENDING_AUTHORIZATION",
      reference: payload.reference,
      checkoutUrl: data.checkout_url || data.link,
      ussdPromptSent: payload.channel === "mobile_money",
      message:
        payload.channel === "mobile_money"
          ? `Authorization prompt sent to ${payload.customer.phone}. Please approve on your phone to complete payment.`
          : "Payment initiated successfully.",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      status: "FAILED",
      reference: payload.reference,
      message: error.message || "Failed to communicate with Lenco API.",
    };
  }
}

/**
 * Re-queries Lenco transaction status by reference for idempotent verification
 */
export async function getLencoTransactionStatus(reference: string): Promise<any> {
  const apiKey = process.env.LENCO_API_KEY;
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";
  const apiUrl = process.env.LENCO_API_URL || "https://api.lenco.co";

  if (isDevMode || !apiKey || apiKey.includes("placeholder")) {
    return {
      status: "successful",
      reference,
      simulated: true,
    };
  }

  try {
    const response = await fetch(`${apiUrl}/v1/transactions-by-reference/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return await response.json();
  } catch (err: any) {
    console.error(`[Lenco Re-query Error] Reference ${reference}:`, err.message);
    return null;
  }
}
