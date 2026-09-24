import { describe, expect, it } from "vitest";
import { toAuthHeaders } from "./auth-headers";

describe("toAuthHeaders", () => {
  it("returns concrete Headers and preserves the session cookie", () => {
    const result = toAuthHeaders(new Headers({ cookie: "better-auth.session_token=test" }));

    expect(result).toBeInstanceOf(Headers);
    expect(result.get("cookie")).toBe("better-auth.session_token=test");
  });

  it("preserves authorization headers", () => {
    const result = toAuthHeaders({ authorization: "Bearer token" });

    expect(result.get("authorization")).toBe("Bearer token");
  });
});
