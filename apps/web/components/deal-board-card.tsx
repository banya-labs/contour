"use client";

import { ArrowUpRight, GripVertical } from "lucide-react";
import type { ContourDealSummary } from "@contour/db";
import { getDealStageLabel, getDealStatusForStage } from "../lib/deal-workflows";
import { writeKanbanDragItem } from "../lib/kanban-dnd";

export type DealBoardDeal = ContourDealSummary;

type DealBoardCardProps = {
  deal: DealBoardDeal;
  onSelect: (dealId: string) => void;
  onDragStart: (dealId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
};

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function statusTone(status: string) {
  switch (status) {
    case "won":
      return "bg-[color:rgba(47,109,68,0.10)] text-[color:var(--success)]";
    case "lost":
      return "bg-[color:rgba(141,43,31,0.10)] text-[color:var(--danger)]";
    default:
      return "bg-[color:rgba(148,98,29,0.12)] text-[color:var(--warning)]";
  }
}

export function DealBoardCard({ deal, onSelect, onDragStart, onDragEnd, isDragging }: DealBoardCardProps) {
  const stageLabel = getDealStageLabel(deal.stage, deal.dealType);
  const effectiveStatus = getDealStatusForStage(deal.stage) === "open" ? deal.status : getDealStatusForStage(deal.stage);

  return (
    <article
      data-kanban-item-id={deal.id}
      data-kanban-stage={deal.stage}
      draggable
      onDragStart={(event) => {
        writeKanbanDragItem(event.dataTransfer, deal.id);
        onDragStart(deal.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => {
        if (!isDragging) {
          onSelect(deal.id);
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
          <p className="truncate text-[14px] font-semibold tracking-[-0.02em]">{deal.title}</p>
          <p className="mt-1 text-[11px] text-[color:var(--muted)]">
            {deal.client?.fullName ?? "Unset"} • {deal.listing?.title ?? "No linked property"}
          </p>
          <p className="mt-2 line-clamp-2 text-[12px] text-[color:var(--muted)]">
            {deal.requestSummary?.trim() ||
              deal.preferredLocation?.trim() ||
              deal.preferredPropertyType?.trim() ||
              "Client enquiry"}
          </p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!isDragging) {
              onSelect(deal.id);
            }
          }}
          className="inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          aria-label={`Open ${deal.title}`}
        >
          <ArrowUpRight className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone(effectiveStatus)}`}>
          {effectiveStatus}
        </span>
        <span className="rounded-full bg-[color:rgba(39,26,0,0.06)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--muted)]">
          {stageLabel}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-[color:var(--muted)]">Value</p>
          <p className="mt-1 text-[15px] font-semibold">{formatMoney(deal.valueCents, deal.currency)}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-1.5 text-[11px] text-[color:var(--muted)] transition-transform duration-200 group-active:scale-95">
          <GripVertical className="size-3.5" />
          Drag
        </div>
      </div>
    </article>
  );
}
