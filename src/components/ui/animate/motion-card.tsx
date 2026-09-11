"use client";

import React from "react";
import { CornerMark } from "@/components/ui/corner-mark";

interface MotionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  withCorners?: boolean;
  active?: boolean;
  className?: string;
}

export function MotionCard({
  children,
  withCorners = false,
  active = false,
  className = "",
  ...props
}: MotionCardProps) {
  return (
    <div
      className={`relative bg-white border transition-all duration-200 ${
        active
          ? "border-contour-red bg-[#fff5f3]/20"
          : "border-editorial-border hover:border-editorial-black"
      } ${className}`}
      {...props}
    >
      {withCorners && (
        <>
          <CornerMark position="top-left" />
          <CornerMark position="top-right" />
          <CornerMark position="bottom-left" />
          <CornerMark position="bottom-right" />
        </>
      )}
      {children}
    </div>
  );
}
