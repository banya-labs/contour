import { describe, expect, it } from "vitest";
import { escapeHtml } from "./html-escape";
describe("receipt HTML", () => {
  it("renders stored agency markup as text", () => {
    expect(escapeHtml('<script>alert("x")</script>&')).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;");
  });
});
