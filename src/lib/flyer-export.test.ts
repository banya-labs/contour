import { describe, expect, it } from "vitest";
import { getFlyerExportDimensions } from "./flyer-export";

describe("flyer export dimensions", () => {
  it("uses the same integer capture dimensions for scale and output", () => {
    expect(getFlyerExportDimensions({ getBoundingClientRect: () => ({ width: 679.4, height: 777 }) }, "4:5")).toEqual({
      width: 679,
      height: 849,
      pixelRatio: 1080 / 679,
    });
  });

  it.each([
    ["4:5", 680, 850, 1080 / 680],
    ["1:1", 680, 680, 1080 / 680],
    ["9:16", 324, 576, 1080 / 324],
  ] as const)("supports the %s export contract", (aspectRatio, width, height, pixelRatio) => {
    expect(getFlyerExportDimensions({ getBoundingClientRect: () => ({ width, height }) }, aspectRatio)).toEqual({
      width,
      height,
      pixelRatio,
    });
  });
});
