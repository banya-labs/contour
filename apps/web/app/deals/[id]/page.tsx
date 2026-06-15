import "../../../lib/load-contour-env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Edit3, LineChart } from "lucide-react";
import {
  findContourListingMatchesForDeal,
  getContourDeal,
  getPrismaClient,
  listContourListings,
} from "@contour/db";
import { WorkspaceShell } from "../../../components/workspace-shell";
import { getDealStageLabel, getDealWorkflow } from "../../../lib/deal-workflows";

export const dynamic = "force-dynamic";

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatValue(value: string | null | undefined) {
  return value ?? "Unset";
}

function formatSpec(value: string | null | undefined) {
  return value?.trim() || "Unset";
}

type DealPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DealDetailPage({ params }: DealPageProps) {
  const { id } = await params;
  const prisma = getPrismaClient();
  const [deal, listings] = await Promise.all([
    getContourDeal(prisma, id),
    listContourListings(prisma, 100),
  ]);

  if (!deal) {
    notFound();
  }

  const workflow = getDealWorkflow(deal.dealType);
  const stageIndex = workflow.stages.findIndex((stage) => stage.value === deal.stage);
  const safeStageIndex = stageIndex >= 0 ? stageIndex : 0;
  const matchingListings = findContourListingMatchesForDeal(deal, listings, 5);
  const hasRequestDetails =
    Boolean(deal.requestSummary?.trim()) ||
    Boolean(deal.preferredPropertyType?.trim()) ||
    Boolean(deal.preferredLocation?.trim()) ||
    Boolean(deal.preferredProvince?.trim()) ||
    Boolean(deal.preferredCityTown?.trim()) ||
    deal.preferredBedrooms !== null ||
    deal.preferredBathrooms !== null;

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1100px] space-y-4">
        <Link
          href="/deals"
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to deals
        </Link>

        <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
                <LineChart className="size-3.5" />
                Deal detail
              </div>
              <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">{deal.title}</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
                Review the client enquiry, request specs, matched listings, and pipeline stage from one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/deals/${deal.id}/edit`}
                className="inline-flex h-11 items-center gap-2 rounded-[999px] bg-[color:var(--primary)] px-4 text-[13px] font-medium text-[color:var(--primary-foreground)] transition-transform duration-150 hover:-translate-y-0.5"
              >
                <Edit3 className="size-4" />
                Edit deal
              </Link>
              <Link
                href="/deals"
                className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
              >
                <ArrowLeft className="size-4" />
                Back to board
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Stage</p>
              <p className="mt-2 text-[18px] font-semibold">{formatValue(getDealStageLabel(deal.stage, deal.dealType))}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Status</p>
              <p className="mt-2 text-[18px] font-semibold">{formatValue(deal.status)}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Value</p>
              <p className="mt-2 text-[18px] font-semibold">{formatMoney(deal.valueCents, deal.currency)}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Linked records</p>
              <p className="mt-2 text-[18px] font-semibold">
                {deal.listing ? "1 listing" : "0 listings"} / {deal.client ? "1 client" : "0 clients"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Pipeline</p>
                <p className="mt-2 text-[14px] font-medium">
                  {workflow.label} workflow
                  <span className="ml-2 text-[12px] font-normal text-[color:var(--muted)]">
                    Step {safeStageIndex + 1} of {workflow.stages.length}
                  </span>
                </p>
              </div>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-[12px] text-[color:var(--muted)]">
                {deal.dealType ?? workflow.dealType}
              </span>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-4">
              {workflow.stages.map((stage, index) => {
                const isCurrent = stage.value === deal.stage;
                const isComplete = safeStageIndex > index;

                return (
                  <div
                    key={stage.value}
                    className={`rounded-[18px] border px-3 py-3 text-[12px] transition-colors ${
                      isCurrent
                        ? "border-[color:var(--primary)] bg-[color:rgba(39,26,0,0.08)] text-[color:var(--foreground)]"
                        : isComplete
                          ? "border-[color:rgba(47,109,68,0.22)] bg-[color:rgba(47,109,68,0.06)] text-[color:var(--foreground)]"
                          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.22em]">
                        {isCurrent ? "Current" : isComplete ? "Done" : "Next"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Request</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Client enquiry</h2>
            <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[13px] font-medium">Summary</p>
              <p className="mt-1 text-[13px] leading-6 text-[color:var(--muted)]">
                {formatSpec(deal.requestSummary)}
              </p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                <p className="text-[11px] text-[color:var(--muted)]">Property type</p>
                <p className="mt-2 text-[14px] font-medium">{formatSpec(deal.preferredPropertyType)}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                <p className="text-[11px] text-[color:var(--muted)]">Location</p>
                <p className="mt-2 text-[14px] font-medium">{formatSpec(deal.preferredLocation)}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                <p className="text-[11px] text-[color:var(--muted)]">Province</p>
                <p className="mt-2 text-[14px] font-medium">{formatSpec(deal.preferredProvince)}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                <p className="text-[11px] text-[color:var(--muted)]">City / town</p>
                <p className="mt-2 text-[14px] font-medium">{formatSpec(deal.preferredCityTown)}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                <p className="text-[11px] text-[color:var(--muted)]">Minimum bedrooms</p>
                <p className="mt-2 text-[14px] font-medium">{formatValue(deal.preferredBedrooms?.toString())}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                <p className="text-[11px] text-[color:var(--muted)]">Minimum bathrooms</p>
                <p className="mt-2 text-[14px] font-medium">{formatValue(deal.preferredBathrooms?.toString())}</p>
              </div>
            </div>
            {!hasRequestDetails ? (
              <p className="mt-4 text-[13px] text-[color:var(--muted)]">
                No explicit requirements have been added yet. Use Edit deal to capture the enquiry.
              </p>
            ) : null}
          </article>

          <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Listing</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Linked property</h2>
            <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              {deal.listing ? (
                <>
                  <p className="text-[13px] font-medium">{deal.listing.title}</p>
                  <p className="mt-1 text-[12px] text-[color:var(--muted)]">Listing ID: {deal.listing.id}</p>
                  <Link
                    href={`/listings/${deal.listing.id}`}
                    className="mt-3 inline-flex items-center gap-2 text-[13px] font-medium text-[color:var(--primary)]"
                  >
                    <ArrowUpRight className="size-4" />
                    Open listing
                  </Link>
                </>
              ) : (
                <p className="text-[13px] text-[color:var(--muted)]">No listing linked.</p>
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Client</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Linked contact</h2>
            <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              {deal.client ? (
                <>
                  <p className="text-[13px] font-medium">{deal.client.fullName}</p>
                  <p className="mt-1 text-[12px] text-[color:var(--muted)]">Client ID: {deal.client.id}</p>
                  <Link
                    href={`/clients/${deal.client.id}`}
                    className="mt-3 inline-flex items-center gap-2 text-[13px] font-medium text-[color:var(--primary)]"
                  >
                    <ArrowUpRight className="size-4" />
                    Open client
                  </Link>
                </>
              ) : (
                <p className="text-[13px] text-[color:var(--muted)]">No client linked.</p>
              )}
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Matches</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Suggested listings</h2>
            <p className="mt-2 text-[13px] text-[color:var(--muted)]">
              These listings match the request fields on this enquiry. This updates automatically as new listings are added.
            </p>
            <div className="mt-4 space-y-3">
              {matchingListings.length ? (
                matchingListings.map((match) => (
                  <div
                    key={match.listing.id}
                    className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-medium">{match.listing.title}</p>
                        <p className="mt-1 line-clamp-2 text-[12px] leading-6 text-[color:var(--muted)]">
                          {match.listing.description?.trim() || "No description added yet"}
                        </p>
                        <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                          {match.listing.propertyType}
                          {match.listing.cityTown || match.listing.province
                            ? ` • ${[match.listing.cityTown, match.listing.province].filter(Boolean).join(", ")}`
                            : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-[color:rgba(39,26,0,0.06)] px-2.5 py-1 text-[11px] text-[color:var(--muted)]">
                        {match.score} pts
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] text-[color:var(--muted)]">
                      {formatMoney(match.listing.priceCents, match.listing.currency)}
                    </p>
                    <ul className="mt-3 space-y-1 text-[12px] text-[color:var(--muted)]">
                      {match.reasons.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                    <Link
                      href={`/listings/${match.listing.id}`}
                      className="mt-3 inline-flex items-center gap-2 text-[13px] font-medium text-[color:var(--primary)]"
                    >
                      <ArrowUpRight className="size-4" />
                      Open listing
                    </Link>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-[13px] text-[color:var(--muted)]">
                  No listings match this enquiry yet. Add more listings or refine the request fields to improve suggestions.
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </WorkspaceShell>
  );
}
