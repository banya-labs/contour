import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ session: vi.fn(), invitation: vi.fn(), member: vi.fn(), link: vi.fn(), transaction: vi.fn(), consume: vi.fn(), upsert: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("@/lib/db", () => ({ db: { invitation: { findUnique: mocks.invitation, findFirst: mocks.invitation }, member: { findFirst: mocks.member, findUnique: mocks.member }, accessRequestLink: { findFirst: mocks.link }, $transaction: mocks.transaction } }));
import { POST } from "./route";
import { hashAccessToken } from "@/lib/access-request";
const token = "test-invitation-capability";
const request = (body: object) => new NextRequest("http://localhost/api/organization/invitations/claim", { method: "POST", body: JSON.stringify(body) });
describe("invitation claim capabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockResolvedValue({ user: { id: "user", email: "recipient@example.com", emailVerified: true } });
    mocks.invitation.mockResolvedValue({ id: "invite", organizationId: "org", organization: { name: "Agency" }, email: "recipient@example.com", roleKey: "FIELD_AGENT", tokenHash: hashAccessToken(token), status: "pending", expiresAt: new Date(Date.now() + 60000) });
    mocks.member.mockResolvedValue(null); mocks.link.mockResolvedValue(null);
    mocks.transaction.mockImplementation(async (fn) => fn({ invitation: { updateMany: mocks.consume }, member: { upsert: mocks.upsert } }));
  });
  it("rejects a known invitation id without its required secret", async () => {
    expect((await POST(request({ invitationId: "invite" }))).status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects another email even when the invitation secret is known", async () => {
    mocks.session.mockResolvedValue({ user: { id: "other", email: "other@example.com", emailVerified: true } });
    expect((await POST(request({ invitationId: "invite", token }))).status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects a concurrent or replayed claim before creating membership", async () => {
    mocks.consume.mockResolvedValue({ count: 0 });
    expect((await POST(request({ invitationId: "invite", token }))).status).toBe(409);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("does not reactivate suspended members through a public joining link", async () => {
    mocks.invitation.mockResolvedValue(null);
    mocks.link.mockResolvedValue({ organizationId: "org", organization: { name: "Agency" } });
    mocks.member.mockResolvedValue({ status: "suspended" });
    expect((await POST(request({ token }))).status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
