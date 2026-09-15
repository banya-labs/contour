import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing/marketing-home";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://contour.banyalabs.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Run Your Real Estate Agency. Chase Nothing.",
  description:
    "The mandate operating system for Lusaka real estate agents. Fixed 5% commission, deal pipeline, title deed verification, cadastral spatial mapping, and automated WhatsApp arrears nudges.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Contour — Run Your Real Estate Agency. Chase Nothing.",
    description:
      "The premier real estate operations and field agent operating system for Lusaka and Southern Africa.",
    url: siteUrl,
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

export default function HomePage() {
  return <MarketingHome />;
}
