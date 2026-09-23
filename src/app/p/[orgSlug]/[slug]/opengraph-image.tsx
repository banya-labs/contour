import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Contour property listing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const { orgSlug, slug } = await params;
  const property = await db.property.findFirst({
    where: { slug, organization: { slug: orgSlug } },
    select: {
      title: true,
      suburb: true,
      city: true,
      askingPrice: true,
      rentalPrice: true,
      currency: true,
      listingType: true,
      featuredPhoto: true,
      photos: true,
    },
  });

  const photos = Array.isArray(property?.photos) ? property.photos : [];
  const coverImage = property?.featuredPhoto || photos[0] || null;
  const price = property?.listingType === "FOR_RENT" ? property.rentalPrice : property?.askingPrice;
  const priceLabel = price ? `${property?.currency || "ZMW"} ${Number(price).toLocaleString()}` : "Contact for price";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#282828", color: "white", fontFamily: "sans-serif" }}>
        {coverImage && <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.2) 70%, rgba(0,0,0,.1) 100%)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "52px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: 28, fontWeight: 800 }}>
            <span style={{ width: 22, height: 22, borderRadius: 99, background: "#fa3600" }} />
            CONTOUR
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: "900px" }}>
            <div style={{ fontSize: 22, color: "#ff7653", fontWeight: 700, textTransform: "uppercase" }}>{property?.suburb || "Lusaka"}, {property?.city || "Zambia"}</div>
            <div style={{ marginTop: 10, fontSize: 58, lineHeight: 1.05, fontWeight: 800 }}>{property?.title || "Property listing"}</div>
            <div style={{ marginTop: 18, fontSize: 30, fontWeight: 700 }}>{priceLabel}</div>
          </div>
          <div style={{ display: "flex", fontSize: 18, color: "#eeeeee" }}>Verified property listing on Contour</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
