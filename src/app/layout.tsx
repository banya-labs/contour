import type { Metadata, Viewport } from "next";
import { CookieConsentBanner } from "@/components/ui/cookie-consent-banner";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://contour.banyalabs.com").replace(/\/$/, "");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Contour - Real Estate Operations & Field Agent OS",
    template: "%s | Contour",
  },
  description:
    "Real estate operations and field agent software. Manage mandates, deal pipelines, commission ledgers, and WhatsApp listing sharing for your agency.",
  applicationName: "Contour",
  authors: [{ name: "Banya Labs", url: "https://banyalabs.com" }],
  creator: "Banya Labs",
  publisher: "Banya Labs",
  keywords: [
    "real estate operations",
    "real estate software",
    "field agent OS",
    "property title documents",
    "cadastral property map",
    "mandate management",
    "commission tracking",
    "property management software",
    "landlord statements",
    "arrears sentinel",
  ],
  alternates: {
    canonical: "./",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Contour",
    title: "Contour - Real Estate Operations & Field Agent OS",
    description:
      "Run your agency. Manage mandates, deal pipelines, commission ledgers, and WhatsApp listing sharing in one place.",
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Contour - Real Estate Operations & Field Agent OS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contour - Real Estate Operations & Field Agent OS",
    description:
      "The operating system for real estate teams. Mandate management, deal pipelines, commission tracking, and property mapping.",
    images: [`${siteUrl}/opengraph-image`],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/brand/contour-mark.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon-192.png",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Contour",
  },
  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      process.env.GOOGLE_SITE_VERIFICATION ||
      "Z790qJpTsIipHr2SDLgw60iSV8mey6wBSCuDagQipa8",
  },
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      "name": "Contour",
      "url": siteUrl,
      "logo": `${siteUrl}/brand/contour-mark.svg`,
      "description":
        "Real estate operations and field agent software for property agencies.",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      "url": siteUrl,
      "name": "Contour Real Estate OS",
      "publisher": {
        "@id": `${siteUrl}/#organization`,
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${siteUrl}/dashboard/map?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      "name": "Contour OS",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "1200",
        "priceCurrency": "ZMW",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleVerification =
    process.env.GOOGLE_SITE_VERIFICATION ||
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
    "Z790qJpTsIipHr2SDLgw60iSV8mey6wBSCuDagQipa8";

  return (
    <html lang="en" className="font-sans">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        {googleVerification && (
          <meta
            name="google-site-verification"
            content={googleVerification}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="bg-white text-editorial-black min-h-screen flex flex-col antialiased selection:bg-contour-red selection:text-white">
        <ServiceWorkerRegistration />
        <ImpersonationBanner />
        <main className="flex-1 flex flex-col">{children}</main>
        <PwaInstallBanner />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
