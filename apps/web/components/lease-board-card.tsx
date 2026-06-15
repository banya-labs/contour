"use client";

import { ArrowUpRight, GripVertical } from "lucide-react";
import { getLeaseStageLabel } from "../lib/lease-workflows";
import { writeKanbanDragItem } from "../lib/kanban-dnd";

export type LeaseBoardLease = {
  id: string;
  leaseName: string;
  leaseStage: string;
  status: string;
  rentAmount: number;
  currency: string;
  billingDay: number;
  depositAmount: number | null;
  listing: { id: string; title: string } | null;
  tenantClient: { id: string; fullName: string } | null;
  rentalChargesCount: number;
  searchIndex?: string;
};

type LeaseBoardCardProps = {
  lease: LeaseBoardLease;
  onSelect: (leaseId: string) => void;
  onDragStart: (leaseId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusTone(status: string) {
  switch (status) {
    case "ended":
      return "bg-[color:rgba(39,26,0,0.08)] text-[color:var(--muted)]";
    default:
      return "bg-[color:rgba(47,109,68,0.10)] text-[color:var(--success)]";
  }
}

export function LeaseBoardCard({ lease, onSelect, onDragStart, onDragEnd, isDragging }: LeaseBoardCardProps) {
  const stageLabel = getLeaseStageLabel(lease.leaseStage);

  return (
    <article
      data-kanban-item-id={lease.id}
      data-kanban-stage={lease.leaseStage}
      draggable
      onDragStart={(event) => {
        writeKanbanDragItem(event.dataTransfer, lease.id);
        onDragStart(lease.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => {
        if (!isDragging) {
          onSelect(lease.id);
        }
      }}
      className={`group cursor-pointer rounded-[20px] border bg-[color:var(--surface)] p-3 shadow-[0_10px_24px_rgba(39,26,0,0.05)] transition-[transform,box-shadow,opacity,border-color] duration-200 hover:-translate-y-0.5 ${
        isDragging
          ? "border-[color:var(--primary)] opacity-55 shadow-[0_18px_36px_rgba(39,26,0,0.11)] scale-[0.99]"
          : "border-[color:var(--border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold tracking-[-0.02em]">{lease.leaseName}</p>
          <p className="mt-1 text-[11px] text-[color:var(--muted)]">
            {lease.listing?.title ?? "Unset"} - {lease.tenantClient?.fullName ?? "Unset"}
          </p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!isDragging) {
              onSelect(lease.id);
            }
          }}
          className="inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          aria-label={`Open ${lease.leaseName}`}
        >
          <ArrowUpRight className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone(lease.status)}`}>
          {lease.status}
        </span>
        <span className="rounded-full bg-[color:rgba(39,26,0,0.06)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--muted)]">
          {stageLabel}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-[color:var(--muted)]">Rent</p>
          <p className="mt-1 text-[15px] font-semibold">{formatMoney(lease.rentAmount, lease.currency)} / mo</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-1.5 text-[11px] text-[color:var(--muted)] transition-transform duration-200 group-active:scale-95">
          <GripVertical className="size-3.5" />
          Drag
        </div>
      </div>
    </article>
  );
}
