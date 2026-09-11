import { afterEach, describe, expect, it, vi } from "vitest";
import { convertCandidatesToWgs84 } from "./coordinates";
import { calculatePolygonAreaSqm, validatePolygon } from "./geometry";
import { sanitizedSurveyDiagramFixture } from "./fixtures/sanitized-survey-diagram";
import { surveyExtractionSchema } from "./types";
import { cadastreSearchSchema, searchGovernmentCadastre } from "./government";
import { extractSurveyCoordinates, parseSurveyNumber } from "./ocr";

afterEach(() => vi.unstubAllGlobals());

describe("cadastral Phase 1 contract", () => {
  it("validates the sanitized survey extraction fixture", () => {
    expect(surveyExtractionSchema.parse(sanitizedSurveyDiagramFixture).schemaVersion).toBe(1);
  });

  it("converts confirmed UTM 35S coordinates into Lusaka-area WGS84", () => {
    const points = convertCandidatesToWgs84(
      sanitizedSurveyDiagramFixture.coordinateCandidates,
      sanitizedSurveyDiagramFixture.coordinateReferenceSystem,
    );
    const first = points.get("A");
    expect(first?.[1]).toBeGreaterThan(-16);
    expect(first?.[1]).toBeLessThan(-15);
    expect(first?.[0]).toBeGreaterThan(27);
    expect(first?.[0]).toBeLessThan(29);
  });

  it("builds a closed polygon and compares calculated area with stated area", () => {
    const points = convertCandidatesToWgs84(
      sanitizedSurveyDiagramFixture.coordinateCandidates,
      sanitizedSurveyDiagramFixture.coordinateReferenceSystem,
    );
    const ring = sanitizedSurveyDiagramFixture.boundarySequence.slice(0, -1).map((label) => points.get(label)!);
    const result = validatePolygon(ring, { statedAreaSqm: 1200, areaTolerancePct: 20 });
    expect(result.polygon?.coordinates[0]).toHaveLength(5);
    expect(result.areaSqm).toBeGreaterThan(900);
    expect(result.areaSqm).toBeLessThan(1500);
    expect(result.flags).not.toContain("AREA_MISMATCH");
    expect(calculatePolygonAreaSqm(ring)).toBe(result.areaSqm);
  });

  it("rejects a self-intersecting ring instead of correcting it silently", () => {
    const result = validatePolygon([[0, 0], [1, 1], [0, 1], [1, 0]]);
    expect(result.valid).toBe(false);
    expect(result.polygon).toBeNull();
    expect(result.flags).toContain("SELF_INTERSECTION");
  });

  it("rejects unbounded government searches", () => {
    expect(() => cadastreSearchSchema.parse({ bbox: { xmin: 28, ymin: -16, xmax: 29, ymax: -15 } })).toThrow();
  });

  it("normalizes official GeoJSON and enforces the client feature limit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      type: "FeatureCollection",
      features: [
        { id: 1, type: "Feature", properties: { "SDE.Lots.OBJECTID": 1, "SDE.Lots.UPID": "LUS/1" }, geometry: { type: "Polygon", coordinates: [[[28, -15], [28.001, -15], [28.001, -15.001], [28, -15],]] } },
        { id: 2, type: "Feature", properties: { "SDE.Lots.OBJECTID": 2 }, geometry: { type: "Polygon", coordinates: [[[28, -15], [28.002, -15], [28.002, -15.002], [28, -15],]] } },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const features = await searchGovernmentCadastre({ bbox: { xmin: 28, ymin: -15.1, xmax: 28.1, ymax: -15 }, maxFeatures: 1 });
    expect(features).toHaveLength(1);
    expect(features[0].sourceLayer).toBe("Lots");
    expect(features[0].geometry?.type).toBe("Polygon");
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("resultRecordCount");
  });

  it("preserves OCR coordinate text while normalizing safe numeric values", () => {
    expect(parseSurveyNumber("637,700.25")).toBe(637700.25);
    const result = extractSurveyCoordinates("UTM Zone 35 South WGS84\nA 637,700 8,295,000\nB 637740 8295000\nC 637740 8295030\nD 637700 8295030");
    expect(result.coordinateReferenceSystem.status).toBe("CONFIRMED");
    expect(result.coordinateCandidates[0]).toMatchObject({ pointLabel: "A", rawEasting: "637,700", easting: 637700 });
    expect(result.validationFlags).toEqual([]);
  });
});
