import { db } from "./db";
import { getBillingAccessState, getTrialEnd, type BillingAccessState } from "./billing-access";
import { getNextBillingPeriod, type BillingCycle } from "./billing-periods";

export type BillingEntitlement = {
  accessState: BillingAccessState;
  paidThrough: Date | null;
  subscriptionStatus: string | null;
  planId: string | null;
  billingCycle: BillingCycle | null;
};

export type BillingEntitlementEvidence = {
  organization: { subscriptionStatus: string | null; subscriptionTier?: string; trialEndsAt: Date | null; createdAt: Date };
  subscription: {
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    planId: string;
    billingCycle: string;
    updatedAt?: Date;
  } | null;
  latestPayment: {
    completedAt: Date | null;
    createdAt: Date;
    planId: string;
    billingCycle: string;
  } | null;
  latestAdjustment?: { actorUserId: string | null; createdAt: Date; details: unknown } | null;
};

function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function auditedAdjustment(evidence: BillingEntitlementEvidence, now: Date): BillingEntitlement | null {
  const adjustment = evidence.latestAdjustment;
  if (!adjustment?.actorUserId?.trim() || !Number.isFinite(adjustment.createdAt.getTime()) || adjustment.createdAt > now) return null;
  // Missing ledger timestamps cannot prove that a grant supersedes settlement.
  if (evidence.subscription && (!evidence.subscription.updatedAt || adjustment.createdAt <= evidence.subscription.updatedAt)) return null;
  if (evidence.latestPayment && adjustment.createdAt <= (evidence.latestPayment.completedAt || evidence.latestPayment.createdAt)) return null;
  const details = jsonObject(adjustment.details);
  const updated = jsonObject(details.updated);
  const organization = evidence.organization;
  if (updated.subscriptionStatus !== organization.subscriptionStatus || updated.subscriptionTier !== organization.subscriptionTier) return null;
  if (details.type === "TRIAL") {
    const recordedExpiry = typeof updated.trialEndsAt === "string" ? new Date(updated.trialEndsAt) : null;
    if (organization.subscriptionStatus !== "trialing" || !recordedExpiry || !organization.trialEndsAt || recordedExpiry.getTime() !== organization.trialEndsAt.getTime()) return null;
    return { accessState: organization.trialEndsAt > now ? "TRIAL_ACTIVE" : "TRIAL_EXPIRED", paidThrough: null, subscriptionStatus: "trialing", planId: null, billingCycle: null };
  }
  const manualTypes = ["STARTER", "GROWTH", "ENTERPRISE", "LIFETIME"];
  if (typeof details.type !== "string" || !manualTypes.includes(details.type) || organization.subscriptionStatus !== "active" || organization.subscriptionTier !== details.type || organization.trialEndsAt !== null || updated.trialEndsAt !== null) return null;
  // These are deliberate audited operator grants, not inferred recurring
  // payments. The existing control-plane contract gives them no expiry.
  return { accessState: "PAID", paidThrough: null, subscriptionStatus: "active", planId: details.type.toLowerCase(), billingCycle: null };
}

/** Resolve existing evidence only; never extend a service period on a read. */
export function resolveBillingEntitlement(evidence: BillingEntitlementEvidence, now = new Date()): BillingEntitlement {
  const manualEntitlement = auditedAdjustment(evidence, now);
  if (manualEntitlement) return manualEntitlement;
  const { organization, subscription, latestPayment } = evidence;
  let status = organization.subscriptionStatus;
  let start: Date | null = null;
  let end: Date | null = null;
  let planId: string | null = null;
  let billingCycle: BillingCycle | null = null;

  if (subscription) {
    // The latest ledger state is authoritative, including canceled and overdue
    // records. A historical payment must never override it.
    status = subscription.status;
    start = subscription.currentPeriodStart;
    end = subscription.currentPeriodEnd;
    planId = subscription.planId;
    billingCycle = subscription.billingCycle === "ANNUAL" ? "ANNUAL" : subscription.billingCycle === "MONTHLY" ? "MONTHLY" : null;
  } else if (latestPayment) {
    // Compatibility for settlements made before the subscription ledger existed.
    // Unknown cycles fail closed rather than inventing paid-through evidence.
    billingCycle = latestPayment.billingCycle === "ANNUAL" ? "ANNUAL" : latestPayment.billingCycle === "MONTHLY" ? "MONTHLY" : null;
    if (billingCycle) {
      start = latestPayment.completedAt || latestPayment.createdAt;
      end = getNextBillingPeriod(start, billingCycle).end;
      planId = latestPayment.planId;
      const organizationStatus = status?.toLowerCase();
      if (!organizationStatus || organizationStatus === "trialing" || organizationStatus === "trial_expired") status = "active";
    }
  }

  // Explicit administrative restriction applies even when a ledger record is
  // funded. Ordinary trial/active organization state does not override ledger.
  if (["past_due", "unpaid", "suspended", "expired"].includes(organization.subscriptionStatus?.toLowerCase() || "")) {
    status = organization.subscriptionStatus;
  }
  const accessState = getBillingAccessState({
    subscriptionStatus: status,
    trialEndsAt: organization.trialEndsAt || getTrialEnd(organization.createdAt),
    currentPeriodStart: start,
    currentPeriodEnd: end,
  }, now);
  return { accessState, paidThrough: end, subscriptionStatus: status, planId, billingCycle };
}

export async function getOrganizationBillingEntitlement(organizationId: string, now = new Date()): Promise<BillingEntitlement> {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { subscriptionStatus: true, subscriptionTier: true, trialEndsAt: true, createdAt: true },
  });
  if (!organization) return { accessState: "TRIAL_EXPIRED", paidThrough: null, subscriptionStatus: null, planId: null, billingCycle: null };
  const subscription = await db.subscription.findFirst({
    where: { organizationId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: { status: true, currentPeriodStart: true, currentPeriodEnd: true, planId: true, billingCycle: true, updatedAt: true },
  });
  const latestPayment = subscription ? null : await db.payment.findFirst({
    where: { organizationId, status: "SUCCESS" },
    orderBy: [{ completedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }, { id: "desc" }],
    select: { completedAt: true, createdAt: true, planId: true, billingCycle: true },
  });
  const latestAdjustment = await db.platformAuditEvent.findFirst({
    where: { targetType: "Organization", targetId: organizationId, capability: "billing.subscription.adjust" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { actorUserId: true, createdAt: true, details: true },
  });
  return resolveBillingEntitlement({ organization, subscription, latestPayment, latestAdjustment }, now);
}
