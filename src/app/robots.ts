import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://contour.banyalabs.com").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/p/", "/privacy", "/terms", "/cookies"],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/kiosk/",
          "/agent/",
          "/accept-invitation/",
          "/upload/",
          "/request-access/",
          "/onboarding/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/p/", "/privacy", "/terms", "/cookies"],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/kiosk/",
          "/agent/",
          "/accept-invitation/",
          "/upload/",
          "/request-access/",
          "/onboarding/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
