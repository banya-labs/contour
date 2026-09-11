import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { cadastreSearchSchema, DEFAULT_LUSAKA_CADASTRE_BBOX, searchGovernmentCadastre } from "@/lib/cadastral";

export const POST = createApiHandler({
  requirePermissions: ["properties.read"],
  bodySchema: cadastreSearchSchema,
  handler: async (_req, { body }) => {
    try {
      const features = await searchGovernmentCadastre(body);
      return NextResponse.json({
        success: true,
        status: features.length > 0 ? "MATCHED" : "NO_MATCH",
        source: { url: "https://www.map.gov.zm/arcgis/rest/services/NSDI_Vector/CadasterNew/MapServer/0", layer: "Lots", fetchedAt: features[0]?.sourceFetchedAt || new Date().toISOString() },
        features,
      });
    } catch (error) {
      return NextResponse.json({ success: false, status: "REVIEW_REQUIRED", error: error instanceof Error ? error.message : "Government cadastral service unavailable" }, { status: 502 });
    }
  },
});

export const GET = async () => NextResponse.json({
  success: false,
  status: "REVIEW_REQUIRED",
  error: "Use POST with a bounded bbox or plot/survey identifier",
  defaultBbox: DEFAULT_LUSAKA_CADASTRE_BBOX,
}, { status: 405 });
