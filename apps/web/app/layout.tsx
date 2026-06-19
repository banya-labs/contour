import type { Metadata } from "next";
import "../lib/load-contour-env";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contour Analytics Engine",
  description:
    "Offline-first real estate CRM and analytics engine with web and desktop shells.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}