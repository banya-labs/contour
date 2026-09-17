import { NextRequest, NextResponse } from "next/server";
import { DocumentType, SecurityLevel } from "@prisma/client";
import { s3Storage } from "@/lib/storage/s3";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { createHash } from "node:crypto";
import {
  convertCandidatesToWgs84,
  validatePolygon,
  calculatePolygonAreaSqm,
  extractSurveyCoordinates,
  CoordinateCandidate,
  CoordinateReferenceSystem,
} from "@/lib/cadastral";
import { sanitizedSurveyDiagramFixture } from "@/lib/cadastral/fixtures/sanitized-survey-diagram";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

interface ExtractedDeedData {
  beacons: CoordinateCandidate[];
  crs: CoordinateReferenceSystem;
  diagramNumber: string | null;
  titleDeedNumber: string | null;
  statedAreaSqm: number | null;
  confidenceScore: number;
  extractionEngine: string;
}

/**
 * Attempt AI OCR extraction via OpenRouter Gemini 2.0 Flash
 */
async function extractViaOpenRouter(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ExtractedDeedData | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
  const base64Data = fileBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const prompt = `You are a certified cadastral surveyor and title deed extraction expert for Zambia and Southern Africa.
Examine this official Title Deed / Cadastral Survey Diagram / Site Plan document.
Locate the coordinate schedule or beacon table (e.g. Points A, B, C, D... or numbered beacons 1, 2, 3...) and diagram details.

Extract and output ONLY a valid JSON object with the following fields:
{
  "diagramNumber": string or null (e.g. "SD/401/2021", "Survey Diagram No. 1284"),
  "titleDeedNumber": string or null (e.g. "LUS-4821", "Title Deed No. 98124/1"),
  "statedAreaSqm": number or null (the stated plot area in square meters. If given in hectares, multiply by 10000),
  "crsText": string (e.g. "UTM Zone 35 South WGS84", "UTM Zone 35S ARC 1950", or "WGS84"),
  "beacons": [
    {
      "pointLabel": string (e.g. "A", "B", "C", "D"),
      "easting": number (X coordinate, Easting in meters or longitude),
      "northing": number (Y coordinate, Northing in meters or latitude)
    }
  ]
}
Return strictly pure JSON with no markdown wrapping or additional text.`;

  try {
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://contour.banyalabs.com",
        "X-Title": "Contour Title Deed OCR",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      console.warn("[TITLE_DEED_OCR_AI_WARN] OpenRouter error:", aiResponse.status);
      return null;
    }

    const payload = await aiResponse.json();
    const rawContent = payload.choices?.[0]?.message?.content?.trim();
    if (!rawContent) return null;

    const cleanJson = rawContent
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(cleanJson);
    if (!parsed.beacons || !Array.isArray(parsed.beacons) || parsed.beacons.length < 3) {
      return null;
    }

    const crsText = parsed.crsText || "UTM Zone 35 South WGS84";
    const parsedCrs = extractSurveyCoordinates(crsText).coordinateReferenceSystem;
    const confirmedCrs: CoordinateReferenceSystem = {
      ...parsedCrs,
      status: "CONFIRMED",
      zone: parsedCrs.zone || 35,
      hemisphere: parsedCrs.hemisphere || "S",
      datum: parsedCrs.datum === "UNKNOWN" ? "WGS84" : parsedCrs.datum,
    };

    const candidates: CoordinateCandidate[] = parsed.beacons.map(
      (b: any, idx: number) => ({
        pointLabel: String(b.pointLabel || String.fromCharCode(65 + idx)),
        rawEasting: String(b.easting),
        rawNorthing: String(b.northing),
        easting: Number(b.easting),
        northing: Number(b.northing),
        pageNumber: 1,
        boundingBox: null,
        ocrConfidence: 0.96,
        extractionMethod: "OCR",
      })
    );

    return {
      beacons: candidates,
      crs: confirmedCrs,
      diagramNumber: parsed.diagramNumber || null,
      titleDeedNumber: parsed.titleDeedNumber || null,
      statedAreaSqm: parsed.statedAreaSqm ? Number(parsed.statedAreaSqm) : null,
      confidenceScore: 0.95,
      extractionEngine: `AI Vision (${model})`,
    };
  } catch (err) {
    console.warn("[TITLE_DEED_OCR_AI_EXCEPTION]", err);
    return null;
  }
}

/**
 * Standard Zambian Survey Diagram Fixture (Kabulonga Stand 4821)
 * Used when running demo mode, sample deed, or offline testing
 */
function getSampleSurveyExtraction(): ExtractedDeedData {
  return {
    beacons: sanitizedSurveyDiagramFixture.coordinateCandidates,
    crs: sanitizedSurveyDiagramFixture.coordinateReferenceSystem,
    diagramNumber: "SD/4821/2023",
    titleDeedNumber: "LUS-KAB-4821/MoL",
    statedAreaSqm: 1200,
    confidenceScore: 0.99,
    extractionEngine: "Zambian Cadastral Diagram Reference (Sanitized)",
  };
}

export async function POST(req: NextRequest) {
  try {
    let tenant = await getTenantContext(req);
    if (!tenant && (process.env.NEXT_PUBLIC_DEV_MODE === "true" || process.env.NODE_ENV !== "production")) {
      tenant = {
        session: {
          user: {
            id: "user_demo_superadmin",
            name: "Demo Principal Broker",
            email: "grace@contour.demo",
            role: "SUPER_ADMIN",
          },
          session: {
            id: "sess_demo",
            activeOrganizationId: "org_contour_demo",
          },
        } as any,
        userId: "user_demo_superadmin",
        organizationId: "org_contour_demo",
        userRole: "SUPER_ADMIN",
        contourRole: "OWNER",
        permissions: [],
      };
    }

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = tenant.organizationId;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const isSample = formData.get("sample") === "true";
    const rawText = formData.get("rawText") as string | null;

    let extractedData: ExtractedDeedData | null = null;
    let vaultDoc: any = null;

    // Handle File Upload & MinIO S3 Vault Storage
    if (file && file.size > 0) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { success: false, error: "File exceeds 15MB limit" },
          { status: 400 }
        );
      }
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          { success: false, error: "Unsupported file type. Please upload a PDF or image (PNG/JPG)." },
          { status: 400 }
        );
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const sha256Checksum = createHash("sha256").update(fileBuffer).digest("hex");

      // Save to MinIO Object Storage
      const objectKey = s3Storage.generateObjectKey(
        organizationId,
        "TITLE_DEED",
        file.name
      );
      await s3Storage.putObject(objectKey, fileBuffer, file.type);

      // Create VaultDocument record
      vaultDoc = await db.vaultDocument.create({
        data: {
          organizationId,
          title: `Title Deed — ${file.name}`,
          docType: DocumentType.TITLE_DEED,
          classification: SecurityLevel.RESTRICTED_MANAGEMENT,
          objectKey,
          originalFileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileType: file.name.split(".").pop()?.toUpperCase() || "PDF",
          uploadedBy: tenant.userId,
          isVerified: false,
          sha256Checksum,
        },
      });

      // 1. First attempt Multimodal AI OCR via Gemini
      extractedData = await extractViaOpenRouter(fileBuffer, file.type);

      // 2. If AI didn't return points, check if rawText or deterministic OCR can parse
      if (!extractedData && rawText) {
        const textResult = extractSurveyCoordinates(rawText);
        if (textResult.coordinateCandidates.length >= 3) {
          extractedData = {
            beacons: textResult.coordinateCandidates,
            crs: textResult.coordinateReferenceSystem,
            diagramNumber: null,
            titleDeedNumber: null,
            statedAreaSqm: null,
            confidenceScore: 0.88,
            extractionEngine: "Cadastral Regex Extractor",
          };
        }
      }

      // 3. If still no points extracted, fallback to sample reference if in dev mode or requested
      if (!extractedData && (isSample || process.env.NEXT_PUBLIC_DEV_MODE === "true")) {
        extractedData = getSampleSurveyExtraction();
      }
    } else if (isSample) {
      extractedData = getSampleSurveyExtraction();
    } else if (rawText) {
      const textResult = extractSurveyCoordinates(rawText);
      if (textResult.coordinateCandidates.length >= 3) {
        extractedData = {
          beacons: textResult.coordinateCandidates,
          crs: textResult.coordinateReferenceSystem,
          diagramNumber: null,
          titleDeedNumber: null,
          statedAreaSqm: null,
          confidenceScore: 0.9,
          extractionEngine: "Cadastral Text Regex",
        };
      }
    }

    if (!extractedData || extractedData.beacons.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not extract survey beacon coordinates from this document. Please ensure the document contains the coordinate table (Points A, B, C... with Eastings/Northings) or surveyor beacon schedule.",
          documentId: vaultDoc?.id || null,
        },
        { status: 422 }
      );
    }

    // Convert Candidate Coordinates from UTM/Local into WGS84
    let wgs84PointsMap: Map<string, [number, number]>;
    try {
      wgs84PointsMap = convertCandidatesToWgs84(
        extractedData.beacons,
        extractedData.crs
      );
    } catch (conversionErr: any) {
      // Fallback: If CRS was missing or conversion threw, ensure UTM 35S fallback
      const fallbackCrs: CoordinateReferenceSystem = {
        kind: "UTM",
        zone: 35,
        hemisphere: "S",
        datum: "WGS84",
        units: "METERS",
        status: "CONFIRMED",
        epsg: 32735,
        sourceText: "Fallback UTM Zone 35S",
      };
      wgs84PointsMap = convertCandidatesToWgs84(extractedData.beacons, fallbackCrs);
    }

    // Prepare WGS84 coordinate ring for polygon geometry: [longitude, latitude]
    const lonLatRing: [number, number][] = [];
    const beaconsOutput: Array<{
      pointLabel: string;
      rawEasting: string;
      rawNorthing: string;
      lat: number;
      lng: number;
    }> = [];

    // Order coordinates according to beacon sequence
    for (const beacon of extractedData.beacons) {
      const pt = wgs84PointsMap.get(beacon.pointLabel);
      if (pt) {
        lonLatRing.push(pt); // [longitude, latitude]
        beaconsOutput.push({
          pointLabel: beacon.pointLabel,
          rawEasting: beacon.rawEasting,
          rawNorthing: beacon.rawNorthing,
          lat: Number(pt[1].toFixed(6)),
          lng: Number(pt[0].toFixed(6)),
        });
      }
    }

    // Validate geometry using cadastral validator
    const validation = validatePolygon(lonLatRing, {
      statedAreaSqm: extractedData.statedAreaSqm,
      areaTolerancePct: 20,
    });

    // Stand boundary for Contour's UI & Leaflet Canvas is [lat, lng][]
    const standBoundary: [number, number][] = beaconsOutput.map((b) => [b.lat, b.lng]);
    const calculatedAreaSqm = validation.areaSqm || calculatePolygonAreaSqm(lonLatRing);

    return NextResponse.json({
      success: true,
      standBoundary,
      plotSizeSqm: Math.round(calculatedAreaSqm),
      statedAreaSqm: extractedData.statedAreaSqm,
      areaDifferencePct:
        extractedData.statedAreaSqm && calculatedAreaSqm > 0
          ? Math.round(
              (Math.abs(calculatedAreaSqm - extractedData.statedAreaSqm) /
                extractedData.statedAreaSqm) *
                100
            )
          : 0,
      beacons: beaconsOutput,
      crs: extractedData.crs,
      diagramNumber: extractedData.diagramNumber,
      titleDeedNumber: extractedData.titleDeedNumber,
      confidenceScore: extractedData.confidenceScore,
      extractionEngine: extractedData.extractionEngine,
      validationFlags: validation.flags,
      document: vaultDoc
        ? {
            id: vaultDoc.id,
            originalFileName: vaultDoc.originalFileName,
            fileSize: vaultDoc.fileSize,
            mimeType: vaultDoc.mimeType,
          }
        : null,
    });
  } catch (error: any) {
    console.error("[EXTRACT_STAND_BOUNDARY_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process title deed OCR" },
      { status: 500 }
    );
  }
}
