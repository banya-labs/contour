import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  subscription: { findFirst: vi.fn() },
  payment: { findFirst: vi.fn() },
  platformAuditEvent: { findFirst: vi.fn() },
}));
vi.mock("./db", () => ({ db: database }));
import { getOrganizationBillingEntitlement, resolveBillingEntitlement, type BillingEntitlementEvidence } from "./billing-entitlement";

const now = new Date("2026-10-05T12:00:00Z");
const organization = { subscriptionStatus: "active", trialEndsAt: null, createdAt: new Date("2026-01-01T00:00:00Z") };
const subscription = { status: "active", currentPeriodStart: new Date("2026-09-25T00:00:00Z"), currentPeriodEnd: new Date("2026-10-25T00:00:00Z"), planId: "growth", billingCycle: "MONTHLY" };
const payment = { completedAt: new Date("2026-09-25T00:00:00Z"), createdAt: new Date("2026-09-25T00:00:00Z"), planId: "starter", billingCycle: "MONTHLY" };
const evidence: BillingEntitlementEvidence = { organization, subscription, latestPayment: null };

describe("billing entitlement evidence", () => {
  it("uses the recorded period for a manually funded subscription", () => {
    expect(resolveBillingEntitlement(evidence, now)).toMatchObject({ accessState: "PAID", paidThrough: subscription.currentPeriodEnd, planId: "growth" });
  });
  it("denies expired and exact-boundary periods", () => {
    expect(resolveBillingEntitlement(evidence, subscription.currentPeriodEnd).accessState).toBe("TRIAL_EXPIRED");
    expect(resolveBillingEntitlement(evidence, new Date("2027-01-01")).accessState).toBe("TRIAL_EXPIRED");
  });
  it("keeps cancellation paid through but denies overdue state", () => {
    expect(resolveBillingEntitlement({ ...evidence, subscription: { ...subscription, status: "canceled" } }, now).accessState).toBe("PAID");
    expect(resolveBillingEntitlement({ ...evidence, subscription: { ...subscription, status: "past_due" }, latestPayment: payment }, now).accessState).toBe("TRIAL_EXPIRED");
    expect(resolveBillingEntitlement({ ...evidence, organization: { ...organization, subscriptionStatus: "past_due" } }, now).accessState).toBe("TRIAL_EXPIRED");
  });
  it("does not fall back to a payment when an authoritative ledger expired", () => {
    expect(resolveBillingEntitlement({ ...evidence, subscription: { ...subscription, currentPeriodEnd: new Date("2026-10-01") }, latestPayment: payment }, now).accessState).toBe("TRIAL_EXPIRED");
  });
  it("rejects future service starts and invalid expiry evidence", () => {
    expect(resolveBillingEntitlement({ ...evidence, subscription: { ...subscription, currentPeriodStart: new Date("2026-10-20") } }, now).accessState).toBe("TRIAL_EXPIRED");
    expect(resolveBillingEntitlement({ ...evidence, subscription: { ...subscription, currentPeriodEnd: new Date("invalid") } }, now).accessState).toBe("TRIAL_EXPIRED");
  });
  it("derives finite monthly and annual legacy periods", () => {
    expect(resolveBillingEntitlement({ ...evidence, subscription: null, latestPayment: payment }, now)).toMatchObject({ accessState: "PAID", paidThrough: new Date("2026-10-25T00:00:00Z") });
    expect(resolveBillingEntitlement({ ...evidence, subscription: null, latestPayment: { ...payment, billingCycle: "ANNUAL" } }, now).paidThrough).toEqual(new Date("2027-09-25T00:00:00Z"));
    expect(resolveBillingEntitlement({ ...evidence, subscription: null, latestPayment: payment }, new Date("2026-10-25T00:00:00Z")).accessState).toBe("TRIAL_EXPIRED");
  });
  it("supports legacy completedAt absence and rejects unknown cycles", () => {
    expect(resolveBillingEntitlement({ ...evidence, subscription: null, latestPayment: { ...payment, completedAt: null } }, now).accessState).toBe("PAID");
    expect(resolveBillingEntitlement({ ...evidence, subscription: null, latestPayment: { ...payment, billingCycle: "UNKNOWN" } }, now).accessState).toBe("TRIAL_EXPIRED");
  });
  it("does not treat active status alone as permanent manual entitlement", () => {
    expect(resolveBillingEntitlement({ organization, subscription: null, latestPayment: null }, now).accessState).toBe("TRIAL_EXPIRED");
  });
});

describe("organization billing evidence loader", () => {
  beforeEach(() => { vi.clearAllMocks(); database.platformAuditEvent.findFirst.mockResolvedValue(null); });
  it("keeps reads tenant scoped and takes the latest successful legacy renewal", async () => {
    database.organization.findUnique.mockResolvedValue(organization);
    database.subscription.findFirst.mockResolvedValue(null);
    database.payment.findFirst.mockResolvedValue({ ...payment, completedAt: new Date("2026-10-01T00:00:00Z") });
    const result = await getOrganizationBillingEntitlement("org-a", now);
    expect(result.paidThrough).toEqual(new Date("2026-11-01T00:00:00Z"));
    expect(database.subscription.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: "org-a" }, orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }] }));
    expect(database.payment.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: "org-a", status: "SUCCESS" }, orderBy: [{ completedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }, { id: "desc" }] }));
  });
  it("does not query historical payments when a ledger exists", async () => {
    database.organization.findUnique.mockResolvedValue(organization);
    database.subscription.findFirst.mockResolvedValue({ ...subscription, status: "past_due" });
    expect((await getOrganizationBillingEntitlement("org-a", now)).accessState).toBe("TRIAL_EXPIRED");
    expect(database.payment.findFirst).not.toHaveBeenCalled();
  });
  it("fails closed for an organization that no longer exists", async () => {
    database.organization.findUnique.mockResolvedValue(null);
    expect((await getOrganizationBillingEntitlement("missing", now)).accessState).toBe("TRIAL_EXPIRED");
    expect(database.subscription.findFirst).not.toHaveBeenCalled();
  });
});

describe("explicit audited operator grants", () => {
  const grantedOrganization = { ...organization, subscriptionTier: "GROWTH" };
  const adjustment = { actorUserId: "platform-owner", createdAt: new Date("2026-10-04T00:00:00Z"), details: { type: "GROWTH", updated: { subscriptionTier: "GROWTH", subscriptionStatus: "active", trialEndsAt: null } } };
  const manual: BillingEntitlementEvidence = { organization: grantedOrganization, subscription: null, latestPayment: null, latestAdjustment: adjustment };
  it("preserves intentional tier grants and lifetime grants without payment inference", () => {
    expect(resolveBillingEntitlement(manual, now)).toMatchObject({ accessState: "PAID", paidThrough: null, planId: "growth" });
    expect(resolveBillingEntitlement({ ...manual, organization: { ...grantedOrganization, subscriptionTier: "LIFETIME" }, latestAdjustment: { ...adjustment, details: { type: "LIFETIME", updated: { subscriptionTier: "LIFETIME", subscriptionStatus: "active", trialEndsAt: null } } } }, now).accessState).toBe("PAID");
  });
  it("requires actor evidence and matching current tier/state", () => {
    expect(resolveBillingEntitlement({ ...manual, latestAdjustment: { ...adjustment, actorUserId: null } }, now).accessState).toBe("TRIAL_EXPIRED");
    expect(resolveBillingEntitlement({ ...manual, organization: { ...grantedOrganization, subscriptionTier: "STARTER" } }, now).accessState).toBe("TRIAL_EXPIRED");
    expect(resolveBillingEntitlement({ ...manual, organization: { ...grantedOrganization, subscriptionStatus: "past_due" } }, now).accessState).toBe("TRIAL_EXPIRED");
  });
  it("does not let discount adjustments manufacture a grant", () => {
    expect(resolveBillingEntitlement({ ...manual, latestAdjustment: { ...adjustment, details: { ...adjustment.details, type: "PERCENTAGE_DISCOUNT" } } }, now).accessState).toBe("TRIAL_EXPIRED");
  });
  it("allows a new grant to supersede an older expired ledger but respects a newer ledger", () => {
    const expired = { ...subscription, currentPeriodEnd: new Date("2026-10-01"), updatedAt: new Date("2026-09-01") };
    expect(resolveBillingEntitlement({ ...manual, subscription: expired }, now).accessState).toBe("PAID");
    expect(resolveBillingEntitlement({ ...manual, subscription: { ...expired, updatedAt: new Date("2026-10-05"), status: "past_due" } }, now).accessState).toBe("TRIAL_EXPIRED");
    expect(resolveBillingEntitlement({ ...manual, subscription: { ...expired, updatedAt: adjustment.createdAt } }, now).accessState).toBe("TRIAL_EXPIRED");
  });
  it("honors an audited trial extension only through its recorded exact boundary", () => {
    const expiry = new Date("2026-10-20T00:00:00Z");
    const trial: BillingEntitlementEvidence = { ...manual, organization: { ...grantedOrganization, subscriptionStatus: "trialing", trialEndsAt: expiry }, subscription: { ...subscription, status: "past_due", updatedAt: new Date("2026-09-01") }, latestAdjustment: { ...adjustment, details: { type: "TRIAL", updated: { subscriptionTier: "GROWTH", subscriptionStatus: "trialing", trialEndsAt: expiry.toISOString() } } } };
    expect(resolveBillingEntitlement(trial, now).accessState).toBe("TRIAL_ACTIVE");
    expect(resolveBillingEntitlement(trial, expiry).accessState).toBe("TRIAL_EXPIRED");
    expect(resolveBillingEntitlement({ ...trial, organization: { ...trial.organization, trialEndsAt: new Date("2026-10-21") } }, now).accessState).toBe("TRIAL_EXPIRED");
  });
  it("uses only the latest override and rejects a future-dated event", () => {
    expect(resolveBillingEntitlement({ ...manual, latestAdjustment: { ...adjustment, createdAt: new Date("2026-11-01") } }, now).accessState).toBe("TRIAL_EXPIRED");
    expect(resolveBillingEntitlement({ ...manual, latestPayment: { ...payment, completedAt: new Date("2026-10-05") } }, now).paidThrough).toEqual(new Date("2026-11-05"));
  });
});
