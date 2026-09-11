import React from "react";

interface CornerMarkProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}

export function CornerMark({ position, className = "" }: CornerMarkProps) {
  const positionClasses = {
    "top-left": "-top-[7px] -left-[7px]",
    "top-right": "-top-[7px] -right-[7px]",
    "bottom-left": "-bottom-[7px] -left-[7px]",
    "bottom-right": "-bottom-[7px] -right-[7px]",
  }[position];

  return (
    <span
      className={`absolute select-none pointer-events-none text-editorial-corner font-heading text-sm font-normal leading-none z-10 ${positionClasses} ${className}`}
      aria-hidden="true"
    >
      +
    </span>
  );
}
