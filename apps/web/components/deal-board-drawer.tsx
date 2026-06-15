"use client";

import Link from "next/link";
import type { DealWorkflowConfig } from "../lib/deal-workflows";
import type { DealBoardDeal } from "./deal-board-card";

type DealOption = {
  id: string;
  label: string;
};

export type DealBoardUpdateInput = {
  title: string;
  stage: string;
  status: string;
  dealType: string;
  valueCents: number;
  currency: string;
  listingId: string;
  clientId: string;
  requestSummary: string;
  preferredPropertyType: string;
  preferredLocation: string;
  preferredProvince: string;
  preferredCityTown: string;
  preferredBedrooms: number | null;
  preferredBathrooms: number | null;
};

type DealBoardDrawerProps = {
  deal: DealBoardDeal | null;
  workflow: DealWorkflowConfig;
  listings: DealOption[];
  clients: DealOption[];
  onClose: () => void;
  onSave: (dealId: string, input: DealBoardUpdateInput) => Promise<void>;
  savingDealId: string | null;
};

export function DealBoardDrawer({
  deal,
  workflow,
  listings,
  clients,
  onClose,
  onSave,
  savingDealId,
}: DealBoardDrawerProps) {
  if (!deal) {
    return (
      <aside className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Deal details</p>
        <p className="mt-3 text-[14px] text-[color:var(--muted)]">Select a deal to view and edit it here.</p>
      </aside>
    );
  }

  const canSave = savingDealId !== deal.id;

  return (
    <aside className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Deal details</p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">{deal.title}</h2>
          <p className="mt-1 text-[13px] text-[color:var(--muted)]">
            Edit the current record without leaving the board.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--muted)]"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-3 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-[13px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[color:var(--muted)]">Listing</span>
          <span className="font-medium">{deal.listing?.title ?? "No linked property"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[color:var(--muted)]">Client</span>
          <span className="font-medium">{deal.client?.fullName ?? "Unset"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[color:var(--muted)]">Status</span>
          <span className="font-medium">{deal.status}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[color:var(--muted)]">Request</span>
          <span className="font-medium">{deal.requestSummary?.trim() || "Unset"}</span>
        </div>
      </div>

      <form
        key={deal.id}
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          await onSave(deal.id, {
            title: String(formData.get("title") ?? "").trim(),
            stage: String(formData.get("stage") ?? "").trim(),
            status: String(formData.get("status") ?? "").trim(),
            dealType: String(formData.get("dealType") ?? "").trim(),
            valueCents: Math.round(Number(String(formData.get("value") ?? "").trim()) * 100),
            currency: String(formData.get("currency") ?? "").trim(),
            listingId: String(formData.get("listingId") ?? "").trim(),
            clientId: String(formData.get("clientId") ?? "").trim(),
            requestSummary: String(formData.get("requestSummary") ?? "").trim(),
            preferredPropertyType: String(formData.get("preferredPropertyType") ?? "").trim(),
            preferredLocation: String(formData.get("preferredLocation") ?? "").trim(),
            preferredProvince: String(formData.get("preferredProvince") ?? "").trim(),
            preferredCityTown: String(formData.get("preferredCityTown") ?? "").trim(),
            preferredBedrooms: String(formData.get("preferredBedrooms") ?? "").trim()
              ? Number(String(formData.get("preferredBedrooms") ?? "").trim())
              : null,
            preferredBathrooms: String(formData.get("preferredBathrooms") ?? "").trim()
              ? Number(String(formData.get("preferredBathrooms") ?? "").trim())
              : null,
          });
        }}
        className="mt-5 space-y-4"
      >
        <input type="hidden" name="dealType" value={deal.dealType ?? workflow.dealType} />

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Title</span>
          <input
            name="title"
            defaultValue={deal.title}
            className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Stage</span>
            <select
              name="stage"
              defaultValue={deal.stage}
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            >
              {workflow.stages.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Status</span>
            <select
              name="status"
              defaultValue={deal.status}
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            >
              <option value="open">open</option>
              <option value="won">won</option>
              <option value="lost">lost</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Value</span>
            <input
              name="value"
              inputMode="decimal"
              defaultValue={String(deal.valueCents / 100)}
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Currency</span>
            <select
              name="currency"
              defaultValue={deal.currency}
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            >
              <option value="ZMW">ZMW</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Listing</span>
            <select
              name="listingId"
              defaultValue={deal.listingId ?? ""}
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            >
              <option value="">
                No linked property yet
              </option>
              {listings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Client</span>
            <select
              name="clientId"
              defaultValue={deal.clientId ?? ""}
              required
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            >
              <option value="">
                Select a client
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Request summary</span>
          <textarea
            name="requestSummary"
            defaultValue={deal.requestSummary ?? ""}
            rows={3}
            className="rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Preferred property type</span>
            <input
              name="preferredPropertyType"
              defaultValue={deal.preferredPropertyType ?? ""}
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Preferred location</span>
            <input
              name="preferredLocation"
              defaultValue={deal.preferredLocation ?? ""}
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Preferred province</span>
            <input
              name="preferredProvince"
              defaultValue={deal.preferredProvince ?? ""}
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Preferred city / town</span>
            <input
              name="preferredCityTown"
              defaultValue={deal.preferredCityTown ?? ""}
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Minimum bedrooms</span>
            <input
              name="preferredBedrooms"
              defaultValue={deal.preferredBedrooms ?? ""}
              inputMode="numeric"
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[12px] font-medium text-[color:var(--foreground)]">Minimum bathrooms</span>
            <input
              name="preferredBathrooms"
              defaultValue={deal.preferredBathrooms ?? ""}
              inputMode="numeric"
              className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex h-11 items-center justify-center rounded-[999px] bg-[color:var(--primary)] px-5 text-[13px] font-medium text-[color:var(--primary-foreground)] transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingDealId === deal.id ? "Saving..." : "Save changes"}
          </button>
          <Link
            href={`/deals/${deal.id}`}
            className="inline-flex h-11 items-center justify-center rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 text-[13px] font-medium"
          >
            Open full page
          </Link>
        </div>
      </form>
    </aside>
  );
}
