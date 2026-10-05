import { describe, expect, it, vi } from "vitest";
import { parseUserInput } from "better-auth/db";
vi.mock("./db", () => ({ db: {} }));
import { auth } from "./auth";
describe("server-owned identity fields", () => {
  it("rejects privilege assignment in signup and profile updates using the installed auth parser", () => {
    expect(() => parseUserInput(auth.options, { role: "SUPER_ADMIN" }, "update")).toThrow();
    expect(parseUserInput(auth.options, { role: "SUPER_ADMIN" }, "create").role).toBe("FIELD_AGENT");
    expect(parseUserInput(auth.options, { phone: "+27000000000" }, "update").phone).toBe("+27000000000");
  });
});
