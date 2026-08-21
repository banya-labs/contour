import type { Metadata } from "next";
import "./globals.css";
import DevModeBanner from "@/components/dev-mode-banner";

export const metadata: Metadata = {
  title: "Contour — Real Estate Operations & Field Agent OS",
  description: "The Real Estate Operations & Field Agent Operating System for Southern Africa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className="bg-[#fdfbfa] text-[#27251e] min-h-screen flex flex-col antialiased">
        <DevModeBanner />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
