import proj4 from "proj4";
import type { CoordinateCandidate, CoordinateReferenceSystem } from "./types";

export type LonLat = [longitude: number, latitude: number];

function sourceDefinition(crs: CoordinateReferenceSystem): string {
  if (crs.kind === "WGS84") return "EPSG:4326";
  if (crs.kind === "EPSG" && crs.epsg) return `EPSG:${crs.epsg}`;
  if (crs.kind === "UTM" && crs.zone && crs.hemisphere) {
    return `+proj=utm +zone=${crs.zone}${crs.hemisphere === "S" ? " +south" : ""} +datum=${crs.datum === "ARC1950" ? "ARC1950" : "WGS84"} +units=m +no_defs`;
  }
  throw new Error("A confirmed coordinate reference system is required");
}

export function convertCandidateToWgs84(
  candidate: CoordinateCandidate,
  crs: CoordinateReferenceSystem,
): LonLat {
  if (crs.status !== "CONFIRMED") throw new Error("Coordinate reference system is not confirmed");
  const [longitude, latitude] = proj4(sourceDefinition(crs), "EPSG:4326", [candidate.easting, candidate.northing]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error(`Converted coordinate for ${candidate.pointLabel} is outside WGS84 bounds`);
  }
  return [longitude, latitude];
}

export function convertCandidatesToWgs84(
  candidates: CoordinateCandidate[],
  crs: CoordinateReferenceSystem,
): Map<string, LonLat> {
  return new Map(candidates.map((candidate) => [candidate.pointLabel, convertCandidateToWgs84(candidate, crs)]));
}
