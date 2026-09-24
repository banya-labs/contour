export type AdminOwner = { name: string; email: string };

export type AgencySummary = {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  createdAt: string;
  owner: AdminOwner | null;
  ownerCount: number;
  _count: { members: number; properties: number };
};

export type AgencyMemberSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phonePresent: boolean;
  createdAt: string;
};

export type AgencySubscriptionSummary = {
  tier: string;
  status: string;
  trialEndsAt: string | null;
  nextPaymentAt: string | null;
  lastPayment: { amount: number; currency: string; completedAt: string | null; billingCycle: string; planId: string } | null;
};

export type AgencyActivityItem = { id: string; action: string; actor: string; createdAt: string; details: unknown };

export type SubscriptionTierSummary = {
  id: string;
  key: string;
  name: string;
  active: boolean;
  subscriberCount: number;
  grossCollected: number;
};

export type LencoConnectionStatus = {
  provider: "LENCO";
  environment: "sandbox" | "production";
  apiUrl: string;
  configured: boolean;
  maskedKey: string | null;
  lastTestAt: string | null;
  lastTestStatus: "SUCCESS" | "FAILED" | null;
};
