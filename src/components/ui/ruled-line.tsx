import React from "react";

interface RuledLineProps {
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "dark" | "dashed";
  className?: string;
}

export function RuledLine({
  orientation = "horizontal",
  variant = "default",
  className = "",
}: RuledLineProps) {
  const borderStyle = variant === "dashed" ? "border-dashed" : "border-solid";
  const borderColor = variant === "dark" ? "border-editorial-black" : "border-editorial-border";

  if (orientation === "vertical") {
    return (
      <div
        className={`w-px h-full border-l ${borderColor} ${borderStyle} ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`w-full h-px border-t ${borderColor} ${borderStyle} ${className}`}
      aria-hidden="true"
    />
  );
}
