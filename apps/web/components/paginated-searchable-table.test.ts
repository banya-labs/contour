import { describe, expect, it } from "vitest";
import { clampPage, compareTableValues, getPageCount, getPageRows } from "./paginated-searchable-table";

describe("paginated searchable table helpers", () => {
  it("calculates the page count using a fixed page size", () => {
    expect(getPageCount(0)).toBe(1);
    expect(getPageCount(1)).toBe(1);
    expect(getPageCount(10)).toBe(1);
    expect(getPageCount(11)).toBe(2);
  });

  it("clamps pages into the valid range", () => {
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(2, 3)).toBe(2);
    expect(clampPage(8, 3)).toBe(3);
  });

  it("returns the rows for the current page", () => {
    const rows = Array.from({ length: 12 }, (_, index) => index + 1);

    expect(getPageRows(rows, 1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(getPageRows(rows, 2)).toEqual([11, 12]);
    expect(getPageRows(rows, 0)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("compares values in both sort directions", () => {
    expect(compareTableValues("alpha", "bravo", "asc")).toBeLessThan(0);
    expect(compareTableValues("alpha", "bravo", "desc")).toBeGreaterThan(0);
    expect(compareTableValues(10, 2, "asc")).toBeGreaterThan(0);
    expect(compareTableValues(new Date("2026-01-01"), new Date("2025-01-01"), "desc")).toBeLessThan(0);
  });
});
