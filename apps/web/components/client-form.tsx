import Link from "next/link";
import { saveContourClientAction } from "../lib/clients";

export type ClientFormValues = {
  fullName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
};

type DuplicateHint = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
};

type ClientFormProps = {
  submitLabel: string;
  initialValues: ClientFormValues;
  clientId?: string;
  cancelHref: string;
  heading: string;
  description: string;
  duplicateHints?: DuplicateHint[];
};

const statusOptions = ["lead", "active", "archived"];

export function ClientForm({
  submitLabel,
  initialValues,
  clientId,
  cancelHref,
  heading,
  description,
  duplicateHints = [],
}: ClientFormProps) {
  return (
    <form
      action={saveContourClientAction}
      className="space-y-6 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Clients</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">{heading}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">{description}</p>
      </div>

      {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Full name</span>
          <input
            name="fullName"
            defaultValue={initialValues.fullName}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            placeholder="M. Chanda"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Email</span>
          <input
            name="email"
            defaultValue={initialValues.email}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            placeholder="m@example.com"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Phone</span>
          <input
            name="phone"
            defaultValue={initialValues.phone}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            placeholder="+260971000000"
          />
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
          <span className="text-[12px] font-medium text-[color:var(--foreground)]">Source</span>
          <input
            name="source"
            defaultValue={initialValues.source}
            className="h-12 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            placeholder="Referral"
          />
        </label>
      </div>

      {duplicateHints.length ? (
        <div className="rounded-[22px] border border-[color:rgba(148,98,29,0.18)] bg-[color:rgba(148,98,29,0.08)] p-4">
          <p className="text-[12px] font-medium text-[color:var(--warning)]">Potential duplicate contacts</p>
          <div className="mt-3 space-y-2">
            {duplicateHints.map((hint) => (
              <div
                key={hint.id}
                className="rounded-[16px] border border-[color:rgba(39,26,0,0.08)] bg-[color:var(--surface)] p-3 text-[13px]"
              >
                <p className="font-medium">{hint.fullName}</p>
                <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                  {hint.email ?? "No email"} {hint.phone ? `· ${hint.phone}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
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
