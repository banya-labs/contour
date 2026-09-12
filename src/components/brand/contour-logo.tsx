import React from "react";

type ContourLogoProps = {
  className?: string;
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
};

const sizeClasses = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-2xl sm:text-3xl",
} as const;

export function ContourLogo({
  className = "",
  compact = false,
  size = "md",
  variant = "light",
}: ContourLogoProps) {
  const textColor = variant === "dark" ? "text-white" : "text-editorial-black";

  return (
    <span
      role="img"
      aria-label="Contour"
      className={`inline-flex items-center gap-[0.18em] font-heading font-bold leading-none tracking-tight ${sizeClasses[size]} ${textColor} ${className}`}
    >
      <span aria-hidden="true">C</span>
      <span
        aria-hidden="true"
        className="inline-block h-[1em] w-[1em] shrink-0 rounded-full bg-editorial-red"
      />
      {!compact && <span aria-hidden="true">NTOUR</span>}
    </span>
  );
}
