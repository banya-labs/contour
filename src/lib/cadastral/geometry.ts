import type { GeoJsonPolygon, ValidationFlag } from "./types";

type LonLat = [longitude: number, latitude: number];

export type PolygonValidationResult = {
  valid: boolean;
  flags: ValidationFlag[];
  polygon: GeoJsonPolygon | null;
  areaSqm: number;
  perimeterM: number;
};

const EARTH_RADIUS_M = 6_378_137;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function localMeters(point: LonLat, origin: LonLat): [number, number] {
  return [
    toRadians(point[0] - origin[0]) * EARTH_RADIUS_M * Math.cos(toRadians(origin[1])),
    toRadians(point[1] - origin[1]) * EARTH_RADIUS_M,
  ];
}

function orientation(a: [number, number], b: [number, number], c: [number, number]): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function segmentsIntersect(a: [number, number], b: [number, number], c: [number, number], d: [number, number]): boolean {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  return abC * abD < 0 && cdA * cdB < 0;
}

function hasSelfIntersection(points: [number, number][]): boolean {
  const edges = points.map((point, index) => [point, points[(index + 1) % points.length]] as const);
  for (let first = 0; first < edges.length; first += 1) {
    for (let second = first + 1; second < edges.length; second += 1) {
      if (second === first + 1 || (first === 0 && second === edges.length - 1)) continue;
      if (segmentsIntersect(edges[first][0], edges[first][1], edges[second][0], edges[second][1])) return true;
    }
  }
  return false;
}

export function calculatePolygonAreaSqm(points: LonLat[]): number {
  if (points.length < 3) return 0;
  const origin = points[0];
  const projected = points.map((point) => localMeters(point, origin));
  let area = 0;
  for (let index = 0; index < projected.length; index += 1) {
    const next = projected[(index + 1) % projected.length];
    area += projected[index][0] * next[1] - next[0] * projected[index][1];
  }
  return Math.abs(area) / 2;
}

export function calculatePolygonPerimeterM(points: LonLat[]): number {
  if (points.length < 2) return 0;
  const origin = points[0];
  const projected = points.map((point) => localMeters(point, origin));
  return projected.reduce((total, point, index) => {
    const next = projected[(index + 1) % projected.length];
    return total + Math.hypot(next[0] - point[0], next[1] - point[1]);
  }, 0);
}

export function validatePolygon(
  points: LonLat[],
  options: { statedAreaSqm?: number | null; areaTolerancePct?: number } = {},
): PolygonValidationResult {
  const flags: ValidationFlag[] = [];
  const distinct = new Set(points.map(([longitude, latitude]) => `${longitude.toFixed(9)},${latitude.toFixed(9)}`));
  if (points.length < 3) flags.push("INSUFFICIENT_POINTS");
  if (distinct.size !== points.length) flags.push("DUPLICATE_POINT");
  if (points.some(([longitude, latitude]) => !Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90)) {
    flags.push("INVALID_COORDINATE");
  }
  if (points.length >= 3 && hasSelfIntersection(points)) flags.push("SELF_INTERSECTION");

  const areaSqm = calculatePolygonAreaSqm(points);
  if (options.statedAreaSqm && options.statedAreaSqm > 0) {
    const differencePct = Math.abs(areaSqm - options.statedAreaSqm) / options.statedAreaSqm * 100;
    if (differencePct > (options.areaTolerancePct ?? 10)) flags.push("AREA_MISMATCH");
  }

  const polygon = flags.includes("INSUFFICIENT_POINTS") || flags.includes("INVALID_COORDINATE") || flags.includes("SELF_INTERSECTION")
    ? null
    : { type: "Polygon" as const, coordinates: [[...points, points[0]]] };
  return { valid: flags.length === 0, flags, polygon, areaSqm, perimeterM: calculatePolygonPerimeterM(points) };
}
