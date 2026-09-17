"use client";

import React, { useEffect } from "react";
import { ContourLogo } from "@/components/brand/contour-logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Contour App Boundary Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-editorial-black font-geist select-none">
      <div className="max-w-md w-full text-center space-y-4">
        <ContourLogo size="lg" />
        <h1 className="text-3xl font-heading font-black tracking-tight text-editorial-black mt-4">
          APPLICATION ERROR
        </h1>
        <p className="text-sm text-editorial-muted">
          An unexpected error occurred while rendering this workspace.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 bg-[#1C1C1A] hover:bg-[#FA3600] text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 border border-editorial-border hover:border-black font-heading font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
