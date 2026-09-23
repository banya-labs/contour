"use client";

import React, { useEffect, useRef } from "react";
import { ContourLogo } from "@/components/brand/contour-logo";
import { ContourSunLoader } from "./contour-sun-loader";

type ContourTransitionScreenProps = {
  label: string;
  description?: string;
};

export function ContourTransitionScreen({
  label,
  description,
}: ContourTransitionScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[100] grid min-h-[100dvh] place-items-center overflow-hidden bg-[#FBF9F5] px-6 py-[max(2rem,env(safe-area-inset-top))] text-[#1C1C1A]"
    >
      <div className="w-full max-w-lg border border-[#E6E4DF] bg-white p-6 text-left shadow-xl sm:p-10">
        <div className="flex items-center justify-between border-b border-[#E6E4DF] pb-5">
          <ContourLogo size="md" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FA3600]">Secure workspace</span>
        </div>
        <div className="mt-8 flex items-start gap-4">
          <ContourSunLoader size="lg" label={label} decorative />
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FA3600]">Contour access check</p>
            <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em] outline-none sm:text-3xl"
        >
          {label}
            </h1>
          </div>
        </div>
        {description && (
          <p className="mt-6 border-l-2 border-[#FA3600] bg-[#FCFBF9] p-4 text-sm leading-6 text-[#666158] sm:text-base">
            {description}
          </p>
        )}
        <div className="mt-8 flex items-center gap-2 border-t border-[#E6E4DF] pt-4 font-mono text-[10px] uppercase tracking-wider text-[#8A8882]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#FA3600]" /> Verifying invitation and organization details
        </div>
      </div>
    </main>
  );
}
