import type { Metadata } from "next";

import { MarketingHome } from "@/components/marketing/marketing-home";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://contour.banyalabs.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Run Your Real Estate Agency. Chase Nothing.",
  description:
    "The operating system for real estate teams. Manage mandates, deal pipelines, commission tracking, title documents, property mapping, and rental arrears.",
  alternates: {
    canonical: `${siteUrl}/home`,
  },
  openGraph: {
    title: "Contour - Run Your Real Estate Agency. Chase Nothing.",
    description:
      "Real estate operations and field agent software for your agency.",
    url: `${siteUrl}/home`,
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Contour Real Estate Operating System",
      },
    ],
  },
};

export default function MarketingHomePage() {
  return <MarketingHome />;
}
