import { afterEach, describe, expect, it } from "vitest";
import { getLaunchTarget } from "./get-launch-target";

const originalEnv = process.env.CONTOUR_WEB_URL;

afterEach(() => {
  process.env.CONTOUR_WEB_URL = originalEnv;
});

describe("getLaunchTarget", () => {
  it("uses the configured web URL when present", () => {
    process.env.CONTOUR_WEB_URL = "https://contour.local";

    expect(getLaunchTarget()).toBe("https://contour.local");
  });

  it("defaults to the local web app", () => {
    delete process.env.CONTOUR_WEB_URL;

    expect(getLaunchTarget()).toBe("http://localhost:3000");
  });
});
