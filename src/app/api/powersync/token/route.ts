import { NextRequest, NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";

const tokenHandler = createApiHandler({
  requireAuth: true,
  handler: async (req, ctx) => {
    const { organizationId, userId } = ctx;

    const orgId = organizationId || "org_contour_demo";
    const sub = userId || "user_demo_superadmin";
    const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiration

    // Construct a structurally valid HS256 JWT
    const headerStr = JSON.stringify({ alg: "HS256", typ: "JWT" });
    const payloadStr = JSON.stringify({
      sub,
      iss: "contour-auth",
      aud: "powersync",
      org_id: orgId,
      exp,
    });

    const headerBase64 = Buffer.from(headerStr).toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
      
    const payloadBase64 = Buffer.from(payloadStr).toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const signatureBase64 = Buffer.from("simulated_signature_secret_key").toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const token = `${headerBase64}.${payloadBase64}.${signatureBase64}`;

    return NextResponse.json({
      success: true,
      token,
      expiresAt: exp,
      powersyncUrl: process.env.POWERSYNC_URL || "http://localhost:8080",
    });
  }
});

export async function GET(req: NextRequest, context?: any) {
  return tokenHandler(req, context);
}
