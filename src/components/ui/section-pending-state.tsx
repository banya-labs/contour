import React from "react";
import { cn } from "@/lib/utils";
import { ContourSunLoader } from "./contour-sun-loader";

type SectionPendingStateProps = {
  label: string;
  description?: string;
  compact?: boolean;
};

export function SectionPendingState({
  label,
  description,
  compact = false,
}: SectionPendingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex items-center justify-center border border-[#ECE7DE] bg-white text-center text-[#1C1C1A]",
        compact ? "gap-3 px-4 py-3" : "min-h-48 flex-col gap-4 px-6 py-8",
      )}
    >
      <ContourSunLoader size="md" label={label} decorative />
      <span className={cn("space-y-1", compact && "text-left")}>
        <span className="block text-sm font-semibold">{label}</span>
        {description && (
          <span className="block text-sm text-[#666158]">{description}</span>
        )}
      </span>
    </div>
  );
}
