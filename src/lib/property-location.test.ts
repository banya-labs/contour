import { describe, expect, it } from "vitest";
import { formatPropertyLocation } from "./property-location";

describe("recorded property locations", () => {
  it("keeps locations in any city and does not append a default city", () => {
    expect(formatPropertyLocation({ suburb: " Riverside ", city: " Harare " })).toBe("Riverside, Harare");
    expect(formatPropertyLocation({ suburb: "Riverside" })).toBe("Riverside");
    expect(formatPropertyLocation({ city: "Ndola" })).toBe("Ndola");
  });

  it("shows an honest missing-location state and avoids repeating the same city", () => {
    expect(formatPropertyLocation(null)).toBe("Location not recorded");
    expect(formatPropertyLocation({ suburb: " ", city: "" })).toBe("Location not recorded");
    expect(formatPropertyLocation({ suburb: "Ndola", city: "ndola" })).toBe("Ndola");
  });
});
