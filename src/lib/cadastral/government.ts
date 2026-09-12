import { createHash } from "node:crypto";
import { z } from "zod";
import { smartCache } from "@/lib/cache";
import { DEFAULT_LUSAKA_CADASTRE_BBOX } from "./types";
import type { GeoJsonPolygon, GovernmentCadastreFeature } from "./types";

export const CADASTRE_LAYER_URL = "https://www.map.gov.zm/arcgis/rest/services/NSDI_Vector/CadasterNew/MapServer/0";

export const cadastreSearchSchema = z.object({
  bbox: z.object({
    xmin: z.number().min(-180).max(180),
    ymin: z.number().min(-90).max(90),
    xmax: z.number().min(-180).max(180),
    ymax: z.number().min(-90).max(90),
  }).optional(),
  plotId: z.string().trim().min(1).max(50).optional(),
  mapName: z.string().trim().min(1).max(50).optional(),
  surveyReference: z.string().trim().min(1).max(50).optional(),
  maxFeatures: z.number().int().min(1).max(100).default(100),
}).superRefine((value, context) => {
  if (!value.bbox && !value.plotId && !value.mapName && !value.surveyReference) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A bounded bbox or identifier is required" });
  }
  if (value.bbox && (value.bbox.xmin >= value.bbox.xmax || value.bbox.ymin >= value.bbox.ymax)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["bbox"], message: "bbox must have positive width and height" });
  }
  if (value.bbox && (value.bbox.xmax - value.bbox.xmin > 0.2 || value.bbox.ymax - value.bbox.ymin > 0.2)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["bbox"], message: "bbox is larger than the bounded search limit" });
  }
});
export type CadastreSearch = z.output<typeof cadastreSearchSchema>;
export type CadastreSearchInput = z.input<typeof cadastreSearchSchema>;

type ArcGisFeature = {
  type?: string;
  id?: string | number;
  properties?: Record<string, unknown>;
  geometry?: { type?: string; coordinates?: unknown };
};

type ArcGisResponse = { type?: string; features?: ArcGisFeature[]; error?: { message?: string } };

function quoteSqlValue(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function polygonFromArcGisGeometry(geometry: ArcGisFeature["geometry"]): GeoJsonPolygon | null {
  if (geometry?.type !== "Polygon" || !Array.isArray(geometry.coordinates)) return null;
  const rings = geometry.coordinates.filter((ring): ring is unknown[] => Array.isArray(ring));
  const outer = rings[0]?.filter((point): point is [number, number] => Array.isArray(point) && point.length >= 2 && typeof point[0] === "number" && typeof point[1] === "number");
  if (!outer || outer.length < 4) return null;
  return { type: "Polygon", coordinates: [outer] };
}

function textProperty(properties: Record<string, unknown> | undefined, key: string): string | null {
  const value = properties?.[key];
  return typeof value === "string" && value.length > 0 ? value : value == null ? null : String(value);
}

function numberProperty(properties: Record<string, unknown> | undefined, key: string): number | null {
  const value = properties?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dateProperty(properties: Record<string, unknown> | undefined, key: string): string | null {
  const value = properties?.[key];
  if (typeof value !== "number" && typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildWhere(search: CadastreSearch): string {
  const clauses = [
    search.plotId ? `SDE.Lots.UPID = ${quoteSqlValue(search.plotId)}` : null,
    search.mapName ? `SDE.Lots.PID = ${quoteSqlValue(search.mapName)}` : null,
    search.surveyReference ? `SDE.Lots.SRREF = ${quoteSqlValue(search.surveyReference)}` : null,
  ].filter(Boolean);
  return clauses.length ? clauses.join(" OR ") : "1=1";
}

function buildQuery(search: CadastreSearch): string {
  const params = new URLSearchParams({
    f: "geojson",
    where: buildWhere(search),
    outFields: ["SDE.Lots.OBJECTID", "SDE.Lots.UPID", "SDE.Lots.PID", "SDE.Lots.SRREF", "SDE.Lots.SURVEY_ARE", "SDE.Lots.SURVEY_UNI", "SDE.Lots.SURVEY_DAT", "SDE.Lots.LANDUSE"].join(","),
    returnGeometry: "true",
    outSR: "4326",
  });
  if (search.bbox) {
    params.set("geometry", JSON.stringify({ xmin: search.bbox.xmin, ymin: search.bbox.ymin, xmax: search.bbox.xmax, ymax: search.bbox.ymax, spatialReference: { wkid: 4326 } }));
    params.set("geometryType", "esriGeometryEnvelope");
    params.set("inSR", "4326");
    params.set("spatialRel", "esriSpatialRelIntersects");
  }
  return `${CADASTRE_LAYER_URL}/query?${params.toString()}`;
}

export async function searchGovernmentCadastre(search: CadastreSearchInput): Promise<GovernmentCadastreFeature[]> {
  const normalized = cadastreSearchSchema.parse(search);
  const cacheKey = JSON.stringify(normalized, Object.keys(normalized).sort());
  return smartCache.getOrSet("government", "cadastre", cacheKey, async () => {
    const response = await fetch(buildQuery(normalized), { signal: AbortSignal.timeout(8_000), headers: { Accept: "application/geo+json, application/json" } });
    if (!response.ok) throw new Error(`Government cadastral service returned HTTP ${response.status}`);
    const payload = await response.json() as ArcGisResponse;
    if (payload.error) throw new Error(payload.error.message || "Government cadastral service returned an error");
    const responseHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    const fetchedAt = new Date().toISOString();
    return (payload.features || []).slice(0, normalized.maxFeatures).map((feature): GovernmentCadastreFeature => {
      const properties = feature.properties;
      return {
        sourceType: "GOVERNMENT_CADASTRE",
        sourceUrl: CADASTRE_LAYER_URL,
        sourceLayer: "Lots",
        sourceFetchedAt: fetchedAt,
        responseHash,
        recordId: textProperty(properties, "SDE.Lots.OBJECTID") || String(feature.id || "unknown"),
        plotId: textProperty(properties, "SDE.Lots.UPID"),
        mapName: textProperty(properties, "SDE.Lots.PID"),
        surveyReference: textProperty(properties, "SDE.Lots.SRREF"),
        surveyArea: numberProperty(properties, "SDE.Lots.SURVEY_ARE"),
        surveyUnit: textProperty(properties, "SDE.Lots.SURVEY_UNI"),
        surveyDate: dateProperty(properties, "SDE.Lots.SURVEY_DAT"),
        landUse: textProperty(properties, "SDE.Lots.LANDUSE"),
        geometry: polygonFromArcGisGeometry(feature.geometry),
      };
    });
  }, 300);
}
