"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { buildSearchIndex } from "../lib/table-search";
import { getLeaseStageLabel, getLeaseStatusForStage, type LeaseWorkflowConfig } from "../lib/lease-workflows";
import { readKanbanDragItem } from "../lib/kanban-dnd";
import { LeaseBoardCard, type LeaseBoardLease } from "./lease-board-card";

type LeaseOption = {
  id: string;
  label: string;
};

type LeasesKanbanBoardProps = {
  boardTitle: string;
  boardDescription: string;
  searchPlaceholder: string;
  toggleLabel: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  workflow: LeaseWorkflowConfig;
  rows: LeaseBoardLease[];
  listings: LeaseOption[];
  clients: LeaseOption[];
  tableHref: string;
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function toBoardRow(lease: LeaseBoardLease) {
  return {
    ...lease,
    searchIndex: buildSearchIndex(
      lease.leaseName,
      getLeaseStageLabel(lease.leaseStage),
      lease.status,
      lease.listing?.title,
      lease.tenantClient?.fullName,
      formatMoney(lease.rentAmount, lease.currency),
      lease.rentAmount,
      lease.currency,
      lease.rentalChargesCount,
      lease.billingDay,
      lease.depositAmount ?? 0,
    ),
  };
}

export function LeasesKanbanBoard({
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
}: LeasesKanbanBoardProps) {
  const router = useRouter();
  const [leases, setLeases] = useState(rows);
  const [query, setQuery] = useState("");
  const [draggedLeaseId, setDraggedLeaseId] = useState<string | null>(null);
  const [activeStageValue, setActiveStageValue] = useState<string | null>(null);
  const [savingLeaseId, setSavingLeaseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  function clearDragState() {
    setDraggedLeaseId(null);
    setActiveStageValue(null);
  }

  useEffect(() => {
    setLeases(rows);
  }, [rows]);

  const filteredLeases = useMemo(() => {
    if (!deferredQuery) {
      return leases;
    }

    return leases.filter((lease) => {
      const searchIndex = lease.searchIndex ?? toBoardRow(lease).searchIndex;
      return searchIndex.includes(deferredQuery);
    });
  }, [deferredQuery, leases]);

  const stageGroups = workflow.stages.map((stage) => ({
    ...stage,
    leases: filteredLeases.filter((lease) => lease.leaseStage === stage.value),
  }));

  async function saveLease(leaseId: string, input: Record<string, unknown>) {
    const previousLease = leases.find((lease) => lease.id === leaseId);
    if (!previousLease) {
      return;
    }

    const nextListing = listings.find((listing) => listing.id === String(input.listingId)) ?? null;
    const nextClient = clients.find((client) => client.id === String(input.tenantClientId)) ?? null;
    const optimisticLease: LeaseBoardLease = {
      ...previousLease,
      leaseName: String(input.leaseName ?? previousLease.leaseName),
      leaseStage: String(input.leaseStage ?? previousLease.leaseStage),
      status: String(input.status ?? previousLease.status),
      rentAmount: Number(input.rentAmount ?? previousLease.rentAmount),
      currency: String(input.currency ?? previousLease.currency),
      billingDay: Number(input.billingDay ?? previousLease.billingDay),
      depositAmount:
        input.depositAmount == null || input.depositAmount === ""
          ? previousLease.depositAmount
          : Number(input.depositAmount),
      listing: nextListing ? { id: nextListing.id, title: nextListing.label } : previousLease.listing,
      tenantClient: nextClient ? { id: nextClient.id, fullName: nextClient.label } : previousLease.tenantClient,
    };

    setSavingLeaseId(leaseId);
    setError(null);
    setLeases((currentLeases) => currentLeases.map((lease) => (lease.id === leaseId ? optimisticLease : lease)));

    try {
      const response = await fetch(`/api/leases/${leaseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as { lease: LeaseBoardLease };
      setLeases((currentLeases) => currentLeases.map((lease) => (lease.id === leaseId ? payload.lease : lease)));
    } catch (caughtError) {
      setLeases((currentLeases) => currentLeases.map((lease) => (lease.id === previousLease.id ? previousLease : lease)));
      setError(caughtError instanceof Error ? caughtError.message : "Failed to update lease");
    } finally {
      setSavingLeaseId(null);
    }
  }

  async function moveLeaseToStage(leaseId: string, leaseStage: string) {
    const lease = leases.find((row) => row.id === leaseId);
    if (!lease || lease.leaseStage === leaseStage) {
      return;
    }

    await saveLease(leaseId, {
      leaseName: lease.leaseName,
      leaseStage,
      status: getLeaseStatusForStage(leaseStage),
      rentAmount: lease.rentAmount,
      currency: lease.currency,
      billingDay: lease.billingDay,
      depositAmount: lease.depositAmount ?? "",
      listingId: lease.listing?.id ?? "",
      tenantClientId: lease.tenantClient?.id ?? "",
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
            {filteredLeases.length} of {leases.length}
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

      {filteredLeases.length ? (
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
                  if (draggedLeaseId) {
                    setActiveStageValue(stage.value);
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (draggedLeaseId) {
                    setActiveStageValue(stage.value);
                  }
                }}
                onDrop={async (event) => {
                  event.preventDefault();
                  const leaseId = readKanbanDragItem(event.dataTransfer, draggedLeaseId);
                  clearDragState();
                  if (leaseId) {
                    await moveLeaseToStage(leaseId, stage.value);
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
                    <p className="text-[11px] text-[color:var(--muted)]">{stage.leases.length} leases</p>
                  </div>
                  <span className="rounded-full bg-[color:rgba(39,26,0,0.06)] px-2.5 py-1 text-[11px] text-[color:var(--muted)]">
                    {stage.terminal ? "Closed" : "Open"}
                  </span>
                </div>

                <div className="space-y-3">
                  {stage.leases.length ? (
                    stage.leases.map((lease) => (
                      <LeaseBoardCard
                        key={lease.id}
                        lease={lease}
                        isDragging={draggedLeaseId === lease.id}
                        onSelect={(leaseId) => router.push(`/finance/leases/${leaseId}`)}
                        onDragStart={(leaseId) => {
                          setDraggedLeaseId(leaseId);
                          setActiveStageValue(stage.value);
                        }}
                        onDragEnd={clearDragState}
                      />
                    ))
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-6 text-center text-[12px] text-[color:var(--muted)]">
                      No leases in this stage
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
          <p className="mt-2 text-[13px] text-[color:var(--muted)]">{emptyStateDescription}</p>
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
