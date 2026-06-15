"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { ContourDealSummary, ContourDealStage, ContourDealStatus, ContourDealType } from "@contour/db";
import {
  getDealStageLabel,
  getDealStatusForStage,
  type DealWorkflowConfig,
} from "../lib/deal-workflows";
import { readKanbanDragItem } from "../lib/kanban-dnd";
import { DealBoardCard } from "./deal-board-card";
import type { DealBoardUpdateInput } from "./deal-board-drawer";

type DealOption = {
  id: string;
  label: string;
};

type DealBoardRecord = ContourDealSummary & {
  searchIndex?: string;
};

type DealsKanbanBoardProps = {
  boardTitle: string;
  boardDescription: string;
  searchPlaceholder: string;
  toggleLabel: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  workflow: DealWorkflowConfig;
  rows: DealBoardRecord[];
  listings: DealOption[];
  clients: DealOption[];
  tableHref: string;
};

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function DealsKanbanBoard({
  boardTitle,
  boardDescription,
  searchPlaceholder,
  toggleLabel,
  emptyStateTitle,
  emptyStateDescription,
  workflow,
  rows,
  listings,
  clients,
  tableHref,
}: DealsKanbanBoardProps) {
  const router = useRouter();
  const [deals, setDeals] = useState<DealBoardRecord[]>(rows);
  const [query, setQuery] = useState("");
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [activeStageValue, setActiveStageValue] = useState<string | null>(null);
  const [savingDealId, setSavingDealId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  function clearDragState() {
    setDraggedDealId(null);
    setActiveStageValue(null);
  }

  useEffect(() => {
    setDeals(rows);
  }, [rows]);

  const filteredDeals = useMemo(() => {
    if (!deferredQuery) {
      return deals;
    }

    return deals.filter((deal) => {
      const searchIndex = deal.searchIndex;
      if (!searchIndex) {
        return false;
      }
      return searchIndex.includes(deferredQuery);
    });
  }, [deals, deferredQuery]);

  const stageGroups = workflow.stages.map((stage) => ({
    ...stage,
    deals: filteredDeals.filter((deal) => deal.stage === stage.value),
  }));

  async function saveDeal(dealId: string, input: DealBoardUpdateInput) {
    const previousDeal = deals.find((deal) => deal.id === dealId);
    if (!previousDeal) {
      return;
    }

    const nextListing = listings.find((listing) => listing.id === input.listingId) ?? null;
    const nextClient = clients.find((client) => client.id === input.clientId) ?? null;
    const optimisticDeal: DealBoardRecord = {
      ...previousDeal,
      title: input.title,
      stage: input.stage as ContourDealStage,
      status: input.status as ContourDealStatus,
      dealType: input.dealType as ContourDealType,
      listingId: input.listingId || null,
      clientId: input.clientId || null,
      requestSummary: input.requestSummary || null,
      preferredPropertyType: input.preferredPropertyType || null,
      preferredLocation: input.preferredLocation || null,
      preferredProvince: input.preferredProvince || null,
      preferredCityTown: input.preferredCityTown || null,
      preferredBedrooms: input.preferredBedrooms ?? null,
      preferredBathrooms: input.preferredBathrooms ?? null,
      valueCents: input.valueCents,
      listing: nextListing ? { id: nextListing.id, title: nextListing.label } : null,
      client: nextClient ? { id: nextClient.id, fullName: nextClient.label } : null,
      searchIndex: previousDeal.searchIndex,
    };

    setSavingDealId(dealId);
    setError(null);
    setDeals((currentDeals) => currentDeals.map((deal) => (deal.id === dealId ? optimisticDeal : deal)));

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as { deal: ContourDealSummary };
      setDeals((currentDeals) =>
        currentDeals.map((deal) => (deal.id === dealId ? payload.deal : deal)),
      );
    } catch (caughtError) {
      setDeals((currentDeals) =>
        currentDeals.map((deal) => (deal.id === previousDeal.id ? previousDeal : deal)),
      );
      setError(caughtError instanceof Error ? caughtError.message : "Failed to update deal");
    } finally {
      setSavingDealId(null);
    }
  }

  async function moveDealToStage(dealId: string, stage: string) {
    const deal = deals.find((row) => row.id === dealId);
    if (!deal || deal.stage === stage) {
      return;
    }

    await saveDeal(dealId, {
      title: deal.title,
      stage,
      status: getDealStatusForStage(stage),
          dealType: deal.dealType ?? workflow.dealType,
          valueCents: deal.valueCents,
          currency: deal.currency,
          listingId: deal.listingId ?? "",
          clientId: deal.clientId ?? "",
          requestSummary: deal.requestSummary ?? "",
          preferredPropertyType: deal.preferredPropertyType ?? "",
          preferredLocation: deal.preferredLocation ?? "",
          preferredProvince: deal.preferredProvince ?? "",
          preferredCityTown: deal.preferredCityTown ?? "",
          preferredBedrooms: deal.preferredBedrooms ?? null,
          preferredBathrooms: deal.preferredBathrooms ?? null,
        });
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">{workflow.label} board</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">{boardTitle}</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">{boardDescription}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-[280px] flex-1">
              <span className="sr-only">{searchPlaceholder}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted)]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-11 w-full rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] pl-10 pr-10 text-[13px] outline-none transition focus:border-[color:var(--primary)]"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--muted)] transition-colors hover:bg-[color:rgba(39,26,0,0.08)] hover:text-[color:var(--foreground)]"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </label>
            <a
              href={tableHref}
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              {toggleLabel}
            </a>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-[color:var(--muted)]">
          <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5">
            {filteredDeals.length} of {deals.length}
          </span>
          <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5">
            {stageGroups.length} stages
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-[22px] border border-[color:rgba(141,43,31,0.18)] bg-[color:rgba(141,43,31,0.06)] p-4 text-[13px] text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}

      {filteredDeals.length ? (
        <div className="overflow-x-auto pb-2">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${stageGroups.length}, minmax(250px, 1fr))`,
              minWidth: `${stageGroups.length * 260}px`,
            }}
          >
            {stageGroups.map((stage) => (
              <section
                key={stage.value}
                data-kanban-stage-value={stage.value}
                onDragEnter={() => {
                  if (draggedDealId) {
                    setActiveStageValue(stage.value);
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (draggedDealId) {
                    setActiveStageValue(stage.value);
                  }
                }}
                onDrop={async (event) => {
                  event.preventDefault();
                  const dealId = readKanbanDragItem(event.dataTransfer, draggedDealId);
                  clearDragState();
                  if (dealId) {
                    await moveDealToStage(dealId, stage.value);
                  }
                }}
                className={`rounded-[24px] border p-3 shadow-[0_12px_28px_rgba(39,26,0,0.04)] transition-[border-color,background-color,box-shadow,transform] duration-200 ${
                  activeStageValue === stage.value
                    ? "border-[color:var(--primary)] bg-[color:rgba(148,98,29,0.05)] shadow-[0_16px_34px_rgba(39,26,0,0.08)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3 px-1 pb-3">
                  <div>
                    <p className="text-[12px] font-semibold tracking-[-0.02em]">{stage.label}</p>
                    <p className="text-[11px] text-[color:var(--muted)]">{stage.deals.length} deals</p>
                  </div>
                  <span className="rounded-full bg-[color:rgba(39,26,0,0.06)] px-2.5 py-1 text-[11px] text-[color:var(--muted)]">
                    {stage.terminal ? "Closed" : "Active"}
                  </span>
                </div>

                <div className="space-y-3">
                  {stage.deals.length ? (
                    stage.deals.map((deal) => (
                      <DealBoardCard
                        key={deal.id}
                        deal={deal}
                        isDragging={draggedDealId === deal.id}
                        onSelect={(dealId) => router.push(`/deals/${dealId}`)}
                        onDragStart={(dealId) => {
                          setDraggedDealId(dealId);
                          setActiveStageValue(stage.value);
                        }}
                        onDragEnd={clearDragState}
                      />
                    ))
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-6 text-center text-[12px] text-[color:var(--muted)]">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <p className="text-[16px] font-semibold">{emptyStateTitle}</p>
          <p className="mt-2 text-[13px] text-[color:var(--muted)]">
            {emptyStateDescription}
          </p>
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 inline-flex h-10 items-center rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              Clear search
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
