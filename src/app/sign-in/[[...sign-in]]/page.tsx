import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { CornerMark } from "@/components/ui/corner-mark";
import { AuthForm } from "@/components/auth/auth-form";
import { ContourLogo } from "@/components/brand/contour-logo";

export const metadata: Metadata = {
  title: "Sign In to Contour Agency Workspace",
  description: "Secure authentication gateway for Contour real estate operations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SignInPage(props: {
  searchParams?: Promise<{ redirect_url?: string; notice?: string }>;
}) {
  const resolvedParams = props.searchParams ? await props.searchParams : {};
  const isAgent =
    resolvedParams?.redirect_url === "/agent" ||
    resolvedParams?.redirect_url?.startsWith("/agent") ||
    resolvedParams?.redirect_url?.startsWith("/kiosk");

  return (
    <div className="min-h-screen bg-white text-editorial-black font-geist flex flex-col justify-between relative selection:bg-editorial-red selection:text-white">
      {/* Top Header Bar */}
      <header className="w-full border-b border-editorial-border py-4 px-6 sm:px-12 flex items-center justify-between">
        <Link
          href="/home"
          className="group"
        >
          <ContourLogo size="md" />
        </Link>
        <div className="flex items-center gap-6">
          <span className="hidden sm:inline-block font-geist text-xs text-editorial-muted uppercase tracking-wider">
            {isAgent ? "FIELD AGENT GATEWAY // ENCRYPTED" : "AUTHENTICATION GATEWAY // ENCRYPTED"}
          </span>
          <Link
            href="/home"
            className="font-geist text-xs text-editorial-black hover:text-editorial-red hover-un font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Center Auth Card with Precision Corner Marks */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12 relative topo-pattern-bg">
        <div className="relative max-w-md w-full bg-white border border-editorial-border p-8 sm:p-10">
          <CornerMark position="top-left" />
          <CornerMark position="top-right" />

          {/* Editorial Title Block */}
          <div className="text-center mb-6 pb-4 border-b border-editorial-border">
            <h1 className="font-heading font-bold text-3xl tracking-tight uppercase text-editorial-black">
              {isAgent ? "FIELD AGENT LOGIN" : "SIGN IN"}
            </h1>
            <p className="mt-1 font-geist text-xs text-editorial-muted">
              {isAgent
                ? "Enter your credentials to access the Contour Lusaka Field Agent PWA."
                : "Enter your credentials to access the Contour agency workspace."}
            </p>
          </div>

          <AuthForm mode="sign-in" />

          <CornerMark position="bottom-left" />
          <CornerMark position="bottom-right" />
        </div>
      </main>

      {/* Bottom Legal / Compliance Strip */}
      <footer className="w-full border-t border-editorial-border py-4 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-editorial-muted">
        <div>© 2026 Contour · Part of Banya Labs · Lusaka, Zambia</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-editorial-black font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
            POPIA Compliant
          </span>
          <span>SSL 256-Bit Encrypted</span>
        </div>
      </footer>
    </div>
  );
}
