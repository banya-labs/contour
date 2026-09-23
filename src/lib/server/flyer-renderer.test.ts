import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { buildFlyerRenderModel } from "@/lib/flyer-render-model";
import { renderFlyerPng, renderFlyerSvg } from "./flyer-renderer";

const pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const model = buildFlyerRenderModel({
  aspectRatio: "4:5", template: "SWISS_LIGHT", isSale: true, title: "Long Townhouse", agencyName: "Agency", suburb: "Woodlands", price: 5000000, currency: "USD", copy: "A consistent flyer description.", features: ["Five bedrooms", "Private pool"], contact: { name: "Seward", phone: "+260" }, imageSlots: { hero: 0, secondaryOne: 1, secondaryTwo: 2 },
});

describe("Satori flyer renderer", () => {
  it("returns an exact SVG viewport and embedded text paths", async () => {
    const svg = await renderFlyerSvg(model, { hero: pixel, secondaryOne: pixel, secondaryTwo: pixel });
    expect(svg).toContain('viewBox="0 0 1080 1350"');
    expect(svg).toContain("<path");
  });

  it("returns PNGs at the exact export contract dimensions", async () => {
    const png = await renderFlyerPng(model, { hero: pixel, secondaryOne: pixel, secondaryTwo: pixel });
    await expect(sharp(png).metadata()).resolves.toMatchObject({ width: 1080, height: 1350, format: "png" });
  });
});
