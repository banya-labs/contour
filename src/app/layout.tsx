import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { clerkEditorialAppearance } from "@/lib/clerk-theme";
import { CookieConsentBanner } from "@/components/ui/cookie-consent-banner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Contour — Real Estate Operations & Field Agent OS",
  description: "The Real Estate Operations & Field Agent Operating System for Southern Africa.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Contour Agent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className="bg-white text-editorial-black min-h-screen flex flex-col antialiased selection:bg-contour-red selection:text-white">
        <ClerkProvider appearance={clerkEditorialAppearance}>
          <main className="flex-1 flex flex-col">{children}</main>
        </ClerkProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}