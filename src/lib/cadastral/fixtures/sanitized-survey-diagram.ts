import type { SurveyExtraction } from "../types";

/** Synthetic fixture based on the sample diagram layout. It contains no real owner or registry data. */
export const sanitizedSurveyDiagramFixture: SurveyExtraction = {
  schemaVersion: 1,
  sourceType: "TITLE_DEED",
  rawText: "SYNTHETIC SURVEY DIAGRAM\nDIAGRAM NO: SAMPLE-001\nCOORDINATE SYSTEM: UTM ZONE 35 SOUTH WGS84\nPOINT A 637700 8295000",
  pages: [{ pageNumber: 1, rawText: "SYNTHETIC SURVEY DIAGRAM - SANITIZED TRAINING FIXTURE" }],
  coordinateReferenceSystem: {
    kind: "UTM", epsg: null, zone: 35, hemisphere: "S", datum: "WGS84", units: "METERS", status: "CONFIRMED",
    sourceText: "UTM ZONE 35 SOUTH WGS84",
  },
  coordinateCandidates: [
    { pointLabel: "A", rawEasting: "637700", rawNorthing: "8295000", easting: 637700, northing: 8295000, pageNumber: 1, boundingBox: null, ocrConfidence: 0.99, extractionMethod: "TABLE" },
    { pointLabel: "B", rawEasting: "637740", rawNorthing: "8295000", easting: 637740, northing: 8295000, pageNumber: 1, boundingBox: null, ocrConfidence: 0.99, extractionMethod: "TABLE" },
    { pointLabel: "C", rawEasting: "637740", rawNorthing: "8295030", easting: 637740, northing: 8295030, pageNumber: 1, boundingBox: null, ocrConfidence: 0.99, extractionMethod: "TABLE" },
    { pointLabel: "D", rawEasting: "637700", rawNorthing: "8295030", easting: 637700, northing: 8295030, pageNumber: 1, boundingBox: null, ocrConfidence: 0.99, extractionMethod: "TABLE" },
  ],
  boundarySequence: ["A", "B", "C", "D", "A"],
  sideMeasurements: [],
  metadata: {
    diagramNumber: { rawText: "SAMPLE-001", normalizedValue: "SAMPLE-001", pageNumber: 1, boundingBox: null, ocrConfidence: 0.99, extractionMethod: "OCR" },
    surveyReference: null, planNumber: null, mapReference: null, plotId: null,
    statedAreaSqm: { rawText: "1200 m²", normalizedValue: 1200, pageNumber: 1, boundingBox: null, ocrConfidence: 0.98, extractionMethod: "OCR" },
    surveyDate: null, approvalArea: null, province: null, landDescription: null,
  },
  validationFlags: [],
};
