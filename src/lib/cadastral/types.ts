import { z } from "zod";

export const boundarySourceTypeSchema = z.enum([
  "TITLE_DEED",
  "GOVERNMENT_CADASTRE",
  "GEOJSON",
  "KML",
  "SHAPEFILE",
  "AGENT_DRAWN",
]);
export type BoundarySourceType = z.infer<typeof boundarySourceTypeSchema>;

export const boundaryStatusSchema = z.enum([
  "PENDING",
  "MATCHED",
  "VERIFIED",
  "REJECTED",
  "SUPERSEDED",
]);
export type BoundaryStatus = z.infer<typeof boundaryStatusSchema>;

export const extractionJobStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "NEEDS_REVIEW",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
export type ExtractionJobStatus = z.infer<typeof extractionJobStatusSchema>;

export const cadastreMatchStatusSchema = z.enum([
  "MATCHED",
  "POSSIBLE_MATCH",
  "NO_MATCH",
  "REVIEW_REQUIRED",
]);
export type CadastreMatchStatus = z.infer<typeof cadastreMatchStatusSchema>;

export const validationFlagSchema = z.enum([
  "CRS_MISSING",
  "CRS_AMBIGUOUS",
  "INVALID_COORDINATE",
  "INSUFFICIENT_POINTS",
  "DUPLICATE_POINT",
  "SELF_INTERSECTION",
  "AREA_MISMATCH",
  "SIDE_LENGTH_MISMATCH",
  "OUTSIDE_EXPECTED_BOUNDS",
  "POINT_ORDER_UNCONFIRMED",
]);
export type ValidationFlag = z.infer<typeof validationFlagSchema>;

export const boundingBoxSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
});

export const extractedFieldSchema = z.object({
  rawText: z.string(),
  normalizedValue: z.union([z.string(), z.number()]).nullable(),
  pageNumber: z.number().int().positive(),
  boundingBox: boundingBoxSchema.nullable(),
  ocrConfidence: z.number().min(0).max(1).nullable(),
  extractionMethod: z.enum(["OCR", "TABLE", "MANUAL", "IMPORT"]),
});
export type ExtractedField = z.infer<typeof extractedFieldSchema>;

export const coordinateReferenceSystemSchema = z.object({
  kind: z.enum(["UTM", "EPSG", "WGS84", "UNKNOWN"]),
  epsg: z.number().int().positive().nullable(),
  zone: z.number().int().min(1).max(60).nullable(),
  hemisphere: z.enum(["N", "S"]).nullable(),
  datum: z.enum(["WGS84", "ARC1950", "UNKNOWN"]),
  units: z.enum(["METERS", "DEGREES", "UNKNOWN"]),
  status: z.enum(["CONFIRMED", "AMBIGUOUS", "MISSING"]),
  sourceText: z.string().nullable(),
});
export type CoordinateReferenceSystem = z.infer<typeof coordinateReferenceSystemSchema>;

export const coordinateCandidateSchema = z.object({
  pointLabel: z.string().regex(/^[A-Z][A-Z0-9_-]{0,7}$/),
  rawEasting: z.string().min(1),
  rawNorthing: z.string().min(1),
  easting: z.number().finite(),
  northing: z.number().finite(),
  pageNumber: z.number().int().positive(),
  boundingBox: boundingBoxSchema.nullable(),
  ocrConfidence: z.number().min(0).max(1).nullable(),
  extractionMethod: z.enum(["OCR", "TABLE", "MANUAL", "IMPORT"]),
});
export type CoordinateCandidate = z.infer<typeof coordinateCandidateSchema>;

export const sideMeasurementSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  rawDistance: z.string().min(1),
  distanceM: z.number().positive(),
  rawBearing: z.string().nullable(),
  bearingDegrees: z.number().min(0).lt(360).nullable(),
  evidence: extractedFieldSchema,
});

export const surveyExtractionSchema = z.object({
  schemaVersion: z.literal(1),
  sourceType: z.literal("TITLE_DEED"),
  rawText: z.string(),
  pages: z.array(z.object({ pageNumber: z.number().int().positive(), rawText: z.string() })),
  coordinateReferenceSystem: coordinateReferenceSystemSchema,
  coordinateCandidates: z.array(coordinateCandidateSchema),
  boundarySequence: z.array(z.string().min(1)),
  sideMeasurements: z.array(sideMeasurementSchema),
  metadata: z.object({
    diagramNumber: extractedFieldSchema.nullable(),
    surveyReference: extractedFieldSchema.nullable(),
    planNumber: extractedFieldSchema.nullable(),
    mapReference: extractedFieldSchema.nullable(),
    plotId: extractedFieldSchema.nullable(),
    statedAreaSqm: extractedFieldSchema.nullable(),
    surveyDate: extractedFieldSchema.nullable(),
    approvalArea: extractedFieldSchema.nullable(),
    province: extractedFieldSchema.nullable(),
    landDescription: extractedFieldSchema.nullable(),
  }),
  validationFlags: z.array(validationFlagSchema),
});
export type SurveyExtraction = z.infer<typeof surveyExtractionSchema>;

export const geoJsonPolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()])).min(4)).min(1),
});
export type GeoJsonPolygon = z.infer<typeof geoJsonPolygonSchema>;

export const boundaryStatusTransitions: Readonly<Record<BoundaryStatus, readonly BoundaryStatus[]>> = {
  PENDING: ["MATCHED", "VERIFIED", "REJECTED", "SUPERSEDED"],
  MATCHED: ["VERIFIED", "REJECTED", "SUPERSEDED"],
  VERIFIED: ["SUPERSEDED"],
  REJECTED: ["PENDING"],
  SUPERSEDED: [],
};

export function canTransitionBoundaryStatus(from: BoundaryStatus, to: BoundaryStatus): boolean {
  return boundaryStatusTransitions[from].includes(to);
}
