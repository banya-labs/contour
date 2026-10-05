type Props = { label: string; completed?: number; total?: number };

/** Measured work uses a real ratio; unknown-duration work stays indeterminate. */
export function OperationProgress({ label, completed, total }: Props) {
  const measured = typeof completed === "number" && typeof total === "number" && total > 0;
  return <div role="status" aria-live="polite" className="space-y-2 p-3 text-sm">
    <p>{label}</p>
    <progress aria-label={label} max={measured ? total : undefined} value={measured ? Math.min(total, Math.max(0, completed)) : undefined} className="h-2 w-full accent-contour-red" />
  </div>;
}
