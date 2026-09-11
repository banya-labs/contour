/**
 * Paystack Payment Gateway & Subscription Integration for Contour
 * Supports ZMW (Zambian Kwacha), USD, and ZAR
 * Channels: Mobile Money (MTN MoMo, Airtel Money), Visa/Mastercard, EFT
 */

import crypto from "crypto";

export type BillingCycle = "MONTHLY" | "ANNUAL";
export type SupportedCurrency = "ZMW" | "USD" | "ZAR";

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
      "Paystack Mobile Money & Card billing",
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
 * Verifies the incoming Paystack webhook HMAC SHA-512 signature
 */
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || "dev_secret_key";
  if (!signature) return false;

  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  return hash === signature;
}

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
    return { amount, formatted: `$ ${amount.toLocaleString()}` };
  } else if (currency === "ZAR") {
    const zarMultiplier = 18.5; // Approximate peg
    amount = Math.round((cycle === "ANNUAL" ? plan.annualUsd : plan.monthlyUsd) * zarMultiplier);
    return { amount, formatted: `R ${amount.toLocaleString()}` };
  } else {
    // Default ZMW
    amount = cycle === "ANNUAL" ? plan.annualZmw : plan.monthlyZmw;
    return { amount, formatted: `K ${amount.toLocaleString()}` };
  }
}
