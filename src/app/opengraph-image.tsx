import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Contour — Real Estate Operations & Field Agent OS";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          backgroundColor: "#FFFFFF",
          backgroundImage: "radial-gradient(#E5E5E5 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          border: "16px solid #111111",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "9999px",
                backgroundColor: "#DC2626",
              }}
            />
            <span
              style={{
                fontSize: "36px",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                color: "#111111",
              }}
            >
              CONTOUR
            </span>
          </div>
          <div
            style={{
              padding: "8px 18px",
              backgroundColor: "#111111",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            LUSAKA // ZAMBIA
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h1
            style={{
              fontSize: "68px",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              color: "#111111",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            RUN YOUR AGENCY.
            <br />
            CHASE NOTHING.
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#555555",
              margin: "12px 0 0 0",
              maxWidth: "850px",
              lineHeight: 1.4,
            }}
          >
            The mandate operating system for Southern African real estate brokerages.
            Deal pipeline, 5% commission ledger & cadastral spatial mapping.
          </p>
        </div>

        {/* Bottom Feature Tags */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "24px",
            borderTop: "2px solid #E5E5E5",
          }}
        >
          <div style={{ display: "flex", gap: "24px", fontSize: "16px", color: "#333333", fontWeight: 600 }}>
            <span>• 180+ Active Mandates</span>
            <span>• K 2.4B Portfolio Value</span>
            <span>• 5% Fixed Split Ledger</span>
            <span>• ZMW / USD Billing</span>
          </div>
          <div style={{ fontSize: "14px", color: "#888888", fontWeight: 500 }}>
            contour.banyalabs.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
