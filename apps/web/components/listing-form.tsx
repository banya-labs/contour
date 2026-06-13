import Link from "next/link";
import { saveContourListingAction } from "../lib/listing-actions";

export type ListingFormValues = {
  title: string;
  propertyType: string;
  status: string;
  price: string;
  currency: string;
  ownerName: string;
};

type ListingFormProps = {
  submitLabel: string;
  initialValues: ListingFormValues;
  listingId?: string;
  cancelHref: string;
  heading: string;
  description: string;
};

const propertyTypeOptions = ["Property", "Vacant land"];
const statusOptions = ["available", "reserved", "under_maintenance", "sold"];
const currencyOptions = ["ZMW", "USD"];

export function ListingForm({
  submitLabel,
  initialValues,
  listingId,
  cancelHref,
  heading,
  description,
}: ListingFormProps) {
  return (
    <form
      action={saveContourListingAction}
      className="space-y-6 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Listings</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">{heading}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">{description}</p>
      </div>

      {listingId ? <input type="hidden" name="listingId" value={listingId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Title</span>
          <input
            name="title"
            defaultValue={initialValues.title}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            placeholder="Lusaka West 14"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Property type</span>
          <select
            name="propertyType"
            defaultValue={initialValues.propertyType}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          >
            {propertyTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
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
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </select>
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
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Price</span>
          <input
            name="price"
            defaultValue={initialValues.price}
            inputMode="decimal"
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            placeholder="1800000"
          />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Owner name</span>
          <input
            name="ownerName"
            defaultValue={initialValues.ownerName}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            placeholder="M. Chanda"
          />
        </label>
      </div>

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
