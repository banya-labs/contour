import React from "react";
import { cn } from "@/lib/utils";

type ContourSunLoaderProps = {
  size?: "sm" | "md" | "lg";
  label: string;
  className?: string;
  decorative?: boolean;
};

export function ContourSunLoader({
  size = "md",
  label,
  className,
  decorative = false,
}: ContourSunLoaderProps) {
  return (
    <span
      className={cn(
        "contour-sun-loader",
        `contour-sun-loader--${size}`,
        className,
      )}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "status", "aria-live": "polite" })}
    >
      <span className="contour-sun-loader__orbit" aria-hidden="true" />
      <span className="contour-sun-loader__disc" aria-hidden="true" />
      {!decorative && <span className="sr-only">{label}</span>}
    </span>
  );
}
