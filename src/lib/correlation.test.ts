import { describe, expect, it } from "vitest";
import { getOrCreateCorrelationId, setCorrelationHeader } from "./correlation";

describe("correlation IDs", () => {
  it("preserves a valid caller correlation ID", () => {
    const request = new Request("http://localhost", {
      headers: { "x-correlation-id": "trace-123" },
    });

    expect(getOrCreateCorrelationId(request)).toBe("trace-123");
  });

  it("creates an ID when the request does not provide one", () => {
    const id = getOrCreateCorrelationId(new Request("http://localhost"));

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("adds the ID to a response", () => {
    const response = setCorrelationHeader(new Response(null), "trace-456");

    expect(response.headers.get("x-correlation-id")).toBe("trace-456");
  });
});
