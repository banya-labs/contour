import { describe, expect, it } from "vitest";
import { contourBrand } from "./brand";

describe("contourBrand", () => {
  it("exposes the core contour palette", () => {
    expect(contourBrand).toEqual({
      name: "Contour Analytics Engine",
      colors: {
        background: "#fdfbfa",
        foreground: "#27251e",
        primary: "#271a00",
        primaryForeground: "#fdfbfa",
      },
    });
  });
});
