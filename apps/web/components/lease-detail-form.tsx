"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { leaseWorkflow, type LeaseStageValue } from "../lib/lease-workflows";

type LeaseOption = {
  id: string;
  label: string;
};

export type LeaseDetailRecord = {
  id: string;
  leaseName: string;
  leaseStage: LeaseStageValue;
  status: "active" | "ended";
  rentAmount: number;
  currency: string;
  billingDay: number;
  depositAmount: number | null;
  listingId: string;
  tenantClientId: string;
};

type LeaseDetailFormProps = {
  lease: LeaseDetailRecord;
  listings: LeaseOption[];
  clients: LeaseOption[];
};

export function LeaseDetailForm({ lease, listings, clients }: LeaseDetailFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const payload = {
          leaseName: String(formData.get("leaseName") ?? "").trim(),
          leaseStage: String(formData.get("leaseStage") ?? "").trim(),
          status: String(formData.get("status") ?? "").trim(),
          rentAmount: Number(String(formData.get("rentAmount") ?? "").trim()),
          currency: String(formData.get("currency") ?? "").trim(),
          billingDay: Number(String(formData.get("billingDay") ?? "").trim()),
          depositAmount: String(formData.get("depositAmount") ?? "").trim(),
          listingId: String(formData.get("listingId") ?? "").trim(),
          tenantClientId: String(formData.get("tenantClientId") ?? "").trim(),
        };

        setIsSaving(true);
        setError(null);

        try {
          const response = await fetch(`/api/leases/${lease.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }

          router.refresh();
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Failed to save lease");
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Lease name</span>
          <input
            name="leaseName"
            defaultValue={lease.leaseName}
            className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Stage</span>
          <select
            name="leaseStage"
            defaultValue={lease.leaseStage}
            className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          >
            {leaseWorkflow.stages.map((stage) => (
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
            defaultValue={lease.status}
            className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          >
            <option value="active">active</option>
            <option value="ended">ended</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Rent amount</span>
          <input
            name="rentAmount"
            inputMode="decimal"
            defaultValue={String(lease.rentAmount)}
            className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Currency</span>
          <select
            name="currency"
            defaultValue={lease.currency}
            className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          >
            <option value="ZMW">ZMW</option>
            <option value="USD">USD</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Billing day</span>
          <input
            name="billingDay"
            inputMode="numeric"
            defaultValue={String(lease.billingDay)}
            className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Deposit amount</span>
          <input
            name="depositAmount"
            inputMode="decimal"
            defaultValue={lease.depositAmount == null ? "" : String(lease.depositAmount)}
            className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Listing</span>
          <select
            name="listingId"
            defaultValue={lease.listingId}
            className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          >
            {listings.map((listing) => (
              <option key={listing.id} value={listing.id}>
                {listing.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Tenant</span>
          <select
            name="tenantClientId"
            defaultValue={lease.tenantClientId}
            className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="rounded-[18px] border border-[color:rgba(141,43,31,0.18)] bg-[color:rgba(141,43,31,0.06)] p-3 text-[12px] text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center rounded-[999px] bg-[color:var(--primary)] px-5 text-[13px] font-medium text-[color:var(--primary-foreground)] transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
