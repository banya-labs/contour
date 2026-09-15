"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Scale } from "lucide-react";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has already made a consent choice
    const consent = localStorage.getItem("contour_dpa_consent");
    if (!consent) {
      // Small delay for smooth entry
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = (choice: "accepted" | "essential") => {
    localStorage.setItem(
      "contour_dpa_consent",
      JSON.stringify({
        status: choice,
        timestamp: new Date().toISOString(),
        act: "Zambia Data Protection Act No. 3 of 2021",
      })
    );
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-6 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-white text-editorial-black border-t-2 border-contour-red border-x border-b border-editorial-border rounded-none p-4 sm:p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pointer-events-auto font-geist animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-8 h-8 rounded-none bg-neutral-100 border border-editorial-border flex items-center justify-center shrink-0 mt-0.5">
              <Scale className="w-4 h-4 text-contour-red" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-editorial-black">
                  Zambia Data Protection & Statutory Privacy Notice
                </h4>
                <span className="text-[10px] font-mono bg-neutral-100 text-editorial-muted px-1.5 py-0.2 border border-editorial-border rounded-none">
                  DPA No. 3 of 2021
                </span>
              </div>
              <p className="text-xs text-editorial-muted leading-relaxed max-w-2xl">
                Contour utilizes cryptographic session tokens and necessary cookies to safeguard document vault sessions, prevent unauthorized NRC / Title Deed inspection, and guarantee statutory compliance under the laws of Zambia. By continuing, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-contour-red underline hover:text-editorial-black font-medium"
                >
                  Terms of Use
                </Link>
                {", "}
                <Link
                  href="/privacy"
                  className="text-contour-red underline hover:text-editorial-black font-medium"
                >
                  Privacy Policy
                </Link>
                {", and "}
                <Link
                  href="/cookies"
                  className="text-contour-red underline hover:text-editorial-black font-medium"
                >
                  Cookie Notice
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-editorial-border">
            <button
              type="button"
              onClick={() => handleAccept("essential")}
              className="flex-1 md:flex-initial px-4 py-2 text-xs font-heading font-semibold uppercase tracking-wider bg-white hover:bg-neutral-50 text-editorial-black rounded-none transition-colors border border-editorial-border hover:border-editorial-black"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={() => handleAccept("accepted")}
              className="flex-1 md:flex-initial px-5 py-2 text-xs font-heading font-semibold uppercase tracking-wider bg-editorial-black hover:bg-contour-red text-white rounded-none transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Accept & Proceed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
