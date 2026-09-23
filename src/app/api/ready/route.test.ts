import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  redisPing: vi.fn(),
  storagePing: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: { $queryRaw: mocks.queryRaw } }));
vi.mock("@/lib/redis", () => ({ redisPing: mocks.redisPing }));
vi.mock("@/lib/storage/s3", () => ({
  S3StorageService: class {
    ping = mocks.storagePing;
  },
}));

import { GET } from "./route";

describe("readiness probe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queryRaw.mockResolvedValue([{ ok: 1 }]);
    mocks.redisPing.mockResolvedValue(true);
    mocks.storagePing.mockResolvedValue(true);
    vi.stubEnv("NODE_ENV", "production");
  });

  it("reports all production dependencies when healthy", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("ready");
    expect(payload.dependencies).toEqual({ database: true, redis: true, objectStorage: true });
  });

  it("returns 503 when a required production dependency is unavailable", async () => {
    mocks.redisPing.mockResolvedValue(false);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.status).toBe("unhealthy");
    expect(payload.dependencies.redis).toBe(false);
  });

  it("does not expose dependency error details in production", async () => {
    mocks.queryRaw.mockRejectedValue(new Error("postgres://secret@example.invalid"));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("secret@example.invalid");
  });
});
