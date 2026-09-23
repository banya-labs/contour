import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  verifyLencoSignature: vi.fn(),
  getLencoTransactionStatus: vi.fn(),
  webhookFindUnique: vi.fn(),
  webhookCreate: vi.fn(),
  webhookUpdate: vi.fn(),
  paymentFindUnique: vi.fn(),
  paymentUpdateMany: vi.fn(),
  organizationUpdate: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/lenco", () => ({
  verifyLencoSignature: mocks.verifyLencoSignature,
  getLencoTransactionStatus: mocks.getLencoTransactionStatus,
}));

vi.mock("@/lib/db", () => ({
  db: {
    webhookEvent: {
      findUnique: mocks.webhookFindUnique,
      create: mocks.webhookCreate,
      update: mocks.webhookUpdate,
    },
    payment: {
      findUnique: mocks.paymentFindUnique,
    },
    $transaction: mocks.transaction,
  },
}));

import { POST } from "./route";

function request(payload: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/webhooks/lenco", {
    method: "POST",
    headers: { "x-lenco-signature": "valid", ...headers },
    body: JSON.stringify(payload),
  });
}

describe("Lenco webhook lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyLencoSignature.mockReturnValue(true);
    mocks.webhookFindUnique.mockResolvedValue(null);
    mocks.webhookCreate.mockResolvedValue({ id: "webhook-1", processedAt: null });
    mocks.paymentFindUnique.mockResolvedValue({
      id: "payment-1",
      organizationId: "org-1",
      planId: "growth",
    });
    mocks.getLencoTransactionStatus.mockResolvedValue({ status: "successful" });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      payment: { updateMany: mocks.paymentUpdateMany },
      organization: { update: mocks.organizationUpdate },
      auditLog: { create: mocks.auditCreate },
      webhookEvent: { update: mocks.webhookUpdate },
    }));
    mocks.paymentUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("rejects invalid signatures before parsing or persistence", async () => {
    mocks.verifyLencoSignature.mockReturnValue(false);

    const response = await POST(request({ event: "transaction.successful", reference: "ref-1" }));

    expect(response.status).toBe(401);
    expect(mocks.webhookCreate).not.toHaveBeenCalled();
  });

  it("rejects payloads without a payment reference", async () => {
    const response = await POST(request({ event: "transaction.successful", data: {} }));

    expect(response.status).toBe(400);
    expect(mocks.webhookCreate).not.toHaveBeenCalled();
  });

  it("acknowledges an already processed delivery without mutating payment state", async () => {
    mocks.webhookFindUnique.mockResolvedValue({ id: "webhook-1", processedAt: new Date() });

    const response = await POST(request({ event: "transaction.successful", reference: "ref-1", id: "event-1" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.duplicate).toBe(true);
    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
  });

  it("settles a verified payment and activates its organization", async () => {
    const response = await POST(request({
      event: "transaction.successful",
      id: "event-1",
      data: { reference: "ref-1", status: "successful", transactionId: "tx-1" },
    }));

    expect(response.status).toBe(200);
    expect(mocks.paymentUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { reference: "ref-1", status: { not: "SUCCESS" } },
    }));
    expect(mocks.organizationUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "org-1" },
      data: expect.objectContaining({ subscriptionTier: "GROWTH", subscriptionStatus: "active" }),
    }));
    expect(mocks.webhookUpdate).toHaveBeenCalled();
  });

  it("does not downgrade a successful payment on a later failure event", async () => {
    mocks.paymentUpdateMany.mockResolvedValue({ count: 0 });

    const response = await POST(request({
      event: "transaction.failed",
      id: "event-2",
      data: { reference: "ref-1", reason: "late provider retry" },
    }));

    expect(response.status).toBe(200);
    expect(mocks.paymentUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { reference: "ref-1", status: { not: "SUCCESS" } },
    }));
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
  });
});
