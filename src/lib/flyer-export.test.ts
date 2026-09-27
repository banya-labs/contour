import { describe, expect, it } from "vitest";
import { getFlyerExportDimensions } from "./flyer-export";

describe("flyer export dimensions", () => {
  it("uses the same integer capture dimensions for scale and output", () => {
    expect(getFlyerExportDimensions({ getBoundingClientRect: () => ({ width: 679.4, height: 777 }) }, "4:5")).toEqual({
      width: 679,
      sourceHeight: 777,
      canvasWidth: 1080,
      canvasHeight: 1350,
    });
  });

  it.each([
    ["4:5", 680, 850, 1080, 1350],
    ["1:1", 680, 680, 1080, 1080],
    ["9:16", 324, 576, 1080, 1920],
  ] as const)("supports the %s export contract", (aspectRatio, width, sourceHeight, canvasWidth, canvasHeight) => {
    expect(getFlyerExportDimensions({ getBoundingClientRect: () => ({ width, height: sourceHeight }) }, aspectRatio)).toEqual({
      width,
      sourceHeight,
      canvasWidth,
      canvasHeight,
    });
  });
});
