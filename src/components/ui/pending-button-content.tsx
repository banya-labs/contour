import React, { type ReactNode } from "react";
import { ContourSunLoader } from "./contour-sun-loader";

type PendingButtonContentProps = {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
  icon?: ReactNode;
};

export function PendingButtonContent({
  pending,
  pendingLabel,
  children,
  icon,
}: PendingButtonContentProps) {
  return (
    <span className="inline-grid grid-flow-col items-center justify-center gap-2 whitespace-nowrap">
      {pending ? (
        <ContourSunLoader size="sm" label={pendingLabel} decorative />
      ) : (
        icon
      )}
      <span>{pending ? pendingLabel : children}</span>
    </span>
  );
}
