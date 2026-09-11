import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import type { CoordinateCandidate, CoordinateReferenceSystem, ValidationFlag } from "./types";

const execFileAsync = promisify(execFile);

export function parseSurveyNumber(raw: string): number | null {
  const normalized = raw.replaceAll(",", "").replace(/\s+/g, "").trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function parseCoordinateCandidates(rawText: string, pageNumber = 1): CoordinateCandidate[] {
  const candidates: CoordinateCandidate[] = [];
  const coordinatePattern = /\b([A-Z][A-Z0-9_-]{0,7})\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)/g;
  for (const match of rawText.matchAll(coordinatePattern)) {
    const easting = parseSurveyNumber(match[2]);
    const northing = parseSurveyNumber(match[3]);
    if (easting === null || northing === null || easting < 10_000 || northing < 100_000) continue;
    candidates.push({
      pointLabel: match[1], rawEasting: match[2], rawNorthing: match[3], easting, northing,
      pageNumber, boundingBox: null, ocrConfidence: null, extractionMethod: "OCR",
    });
  }
  return candidates;
}

export function parseCoordinateReferenceSystem(rawText: string): CoordinateReferenceSystem {
  const normalized = rawText.toUpperCase();
  const zoneMatch = normalized.match(/(?:UTM|ZONE)\s*(?:ZONE\s*)?(\d{1,2})\s*([NS])?/);
  const epsgMatch = normalized.match(/EPSG\s*[: ]\s*(\d{4,6})/);
  const zone = zoneMatch ? Number(zoneMatch[1]) : null;
  const hemisphere = (zoneMatch?.[2] as "N" | "S" | undefined) || (epsgMatch && Number(epsgMatch[1]) >= 32700 ? "S" : null);
  const epsg = epsgMatch ? Number(epsgMatch[1]) : zone && hemisphere ? (hemisphere === "S" ? 32700 + zone : 32600 + zone) : null;
  const datum = normalized.includes("ARC 1950") || normalized.includes("ARC1950") ? "ARC1950" : normalized.includes("WGS") ? "WGS84" : "UNKNOWN";
  const status = zone && hemisphere ? "CONFIRMED" : epsg ? "CONFIRMED" : normalized.includes("UTM") ? "AMBIGUOUS" : "MISSING";
  return {
    kind: zone && hemisphere ? "UTM" : epsg ? "EPSG" : "UNKNOWN",
    epsg, zone, hemisphere, datum, units: zone || epsg ? "METERS" : "UNKNOWN", status,
    sourceText: zone || epsg || normalized.includes("UTM") ? rawText.slice(0, 240) : null,
  };
}

export function extractSurveyCoordinates(rawText: string, pageNumber = 1): {
  coordinateReferenceSystem: CoordinateReferenceSystem;
  coordinateCandidates: CoordinateCandidate[];
  boundarySequence: string[];
  validationFlags: ValidationFlag[];
} {
  const coordinateReferenceSystem = parseCoordinateReferenceSystem(rawText);
  const coordinateCandidates = parseCoordinateCandidates(rawText, pageNumber);
  const validationFlags: ValidationFlag[] = [];
  if (coordinateReferenceSystem.status === "MISSING") validationFlags.push("CRS_MISSING");
  if (coordinateReferenceSystem.status === "AMBIGUOUS") validationFlags.push("CRS_AMBIGUOUS");
  if (coordinateCandidates.length < 3) validationFlags.push("INSUFFICIENT_POINTS");
  const boundarySequence = coordinateCandidates.map((candidate) => candidate.pointLabel);
  return { coordinateReferenceSystem, coordinateCandidates, boundarySequence, validationFlags };
}

/**
 * Deployment worker primitive. Tesseract is deliberately invoked as a local process;
 * callers should translate a missing binary/timeout into a recoverable job failure.
 */
export async function runTesseract(inputPath: string, outputBasePath: string, timeoutMs = 120_000): Promise<string> {
  try {
    await execFileAsync("tesseract", [inputPath, outputBasePath, "--psm", "6"], { timeout: timeoutMs, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
    return readFile(`${outputBasePath}.txt`, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR process failed";
    throw new Error(message.includes("ENOENT") ? "OCR_ENGINE_UNAVAILABLE" : "OCR_PROCESS_FAILED");
  }
}
