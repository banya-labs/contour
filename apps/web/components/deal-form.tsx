import Link from "next/link";
import { saveContourDealAction } from "../lib/deals";

export type DealFormValues = {
  title: string;
  stage: string;
  status: string;
  value: string;
  currency: string;
  listingId: string;
  clientId: string;
};

type DealOption = {
  id: string;
  label: string;
};

type DealFormProps = {
  submitLabel: string;
  initialValues: DealFormValues;
  dealId?: string;
  cancelHref: string;
  heading: string;
  description: string;
  listings: DealOption[];
  clients: DealOption[];
};

const stageOptions = [
  "new",
  "viewing",
  "negotiating",
  "contract",
  "closed_won",
  "closed_lost",
];

const statusOptions = ["open", "won", "lost"];
const currencyOptions = ["ZMW", "USD"];

function optionLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function DealForm({
  submitLabel,
  initialValues,
  dealId,
  cancelHref,
  heading,
  description,
  listings,
  clients,
}: DealFormProps) {
  const hasListings = listings.length > 0;
  const hasClients = clients.length > 0;

  return (
    <form
      action={saveContourDealAction}
      className="space-y-6 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Deals</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">{heading}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">{description}</p>
      </div>

      {dealId ? <input type="hidden" name="dealId" value={dealId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Title</span>
          <input
            name="title"
            defaultValue={initialValues.title}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            placeholder="Ndola West Offer"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Stage</span>
          <select
            name="stage"
            defaultValue={initialValues.stage}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          >
            {stageOptions.map((option) => (
              <option key={option} value={option}>
                {optionLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Status</span>
          <select
            name="status"
            defaultValue={initialValues.status}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Value</span>
          <input
            name="value"
            defaultValue={initialValues.value}
            inputMode="decimal"
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            placeholder="2750000"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Currency</span>
          <select
            name="currency"
            defaultValue={initialValues.currency}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          >
            {currencyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Listing</span>
          <select
            name="listingId"
            defaultValue={initialValues.listingId}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          >
            <option value="" disabled>
              {hasListings ? "Select a listing" : "No listings available"}
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
            defaultValue={initialValues.clientId}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          >
            <option value="" disabled>
              {hasClients ? "Select a client" : "No clients available"}
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!hasListings || !hasClients ? (
        <p className="rounded-[18px] border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-4 py-3 text-[13px] text-[color:var(--muted)]">
          Create at least one listing and one client before saving a deal.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-[999px] bg-[color:var(--primary)] px-5 text-[13px] font-medium text-[color:var(--primary-foreground)] transition-transform duration-150 hover:-translate-y-0.5"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="inline-flex h-11 items-center justify-center rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 text-[13px] font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
