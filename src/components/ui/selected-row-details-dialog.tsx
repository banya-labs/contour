"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

export type SelectedRowDetail = {
  label: string;
  value: ReactNode;
};

type SelectedRowDetailsDialogProps = {
  open: boolean;
  eyebrow: string;
  title: string;
  subtitle?: string;
  details: SelectedRowDetail[];
  children?: ReactNode;
  onClose: () => void;
};

export function SelectedRowDetailsDialog({ open, eyebrow, title, subtitle, details, children, onClose }: SelectedRowDetailsDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`${eyebrow}: ${title}`}>
      <div className="bg-white w-full max-w-2xl max-h-[90dvh] overflow-y-auto border border-editorial-border shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-editorial-border p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-contour-red">{eyebrow}</p>
            <h2 className="mt-1 font-heading text-xl font-bold text-editorial-black">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-editorial-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center border border-editorial-border text-editorial-muted hover:border-editorial-black hover:text-editorial-black" aria-label="Close details">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-px bg-editorial-border sm:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label} className="bg-white p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-editorial-muted">{detail.label}</p>
              <div className="mt-1 text-sm font-semibold text-editorial-black break-words">{detail.value || "—"}</div>
            </div>
          ))}
        </div>
        {children && <div className="border-t border-editorial-border p-5 sm:p-6">{children}</div>}
      </div>
    </div>
  );
}
