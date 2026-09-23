import { describe, expect, it } from "vitest";
import { buildFlyerRenderModel, FLYER_CANVAS } from "./flyer-render-model";

describe("flyer render model", () => {
  it("defines exact export dimensions for every supported format", () => {
    expect(FLYER_CANVAS).toEqual({
      "4:5": { width: 1080, height: 1350 },
      "1:1": { width: 1080, height: 1080 },
      "9:16": { width: 1080, height: 1920 },
    });
  });

  it("normalizes user-edited copy and limits features without inventing content", () => {
    const model = buildFlyerRenderModel({
      aspectRatio: "4:5",
      template: "SWISS_LIGHT",
      isSale: true,
      title: "  Modern   Townhouse ",
      agencyName: null,
      suburb: " Woodlands ",
      price: 5000000,
      currency: "usd",
      copy: "  Exact   user copy. ",
      features: ["One", null, " Two ", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"],
      contact: { name: " Seward ", phone: " +260 97 " },
      imageSlots: { hero: -1.4, secondaryOne: 1.9, secondaryTwo: 2 },
    });

    expect(model.title).toBe("Modern Townhouse");
    expect(model.agencyName).toBe("Agency");
    expect(model.copy).toBe("Exact user copy.");
    expect(model.features).toEqual(["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"]);
    expect(model.imageSlots).toEqual({ hero: 0, secondaryOne: 1, secondaryTwo: 2 });
  });
});
