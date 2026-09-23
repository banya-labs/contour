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
      <div className="flex max-w-md flex-col items-center text-center">
        <ContourLogo size="md" />
        <ContourSunLoader
          size="lg"
          label={label}
          decorative
          className="mt-10"
        />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-8 font-heading text-3xl font-semibold tracking-[-0.03em] outline-none sm:text-4xl"
        >
          {label}
        </h1>
        {description && (
          <p className="mt-3 max-w-[42ch] text-sm leading-6 text-[#666158] sm:text-base">
            {description}
          </p>
        )}
      </div>
    </main>
  );
}
