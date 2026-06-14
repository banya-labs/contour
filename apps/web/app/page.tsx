import "../lib/load-contour-env";
import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  Database,
  FileText,
  Home as HomeIcon,
  LineChart,
  Plus,
  Sparkles,
  Workflow,
  Users,
} from "lucide-react";
import {
  getContourDashboardSnapshot,
} from "@contour/db";
import { WorkspaceShell } from "../components/workspace-shell";

export const dynamic = "force-dynamic";

type ContourSessionUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  emailAddresses: Array<{ emailAddress: string }>;
};

async function getCurrentContourUser(): Promise<ContourSessionUser | null> {
  return null;
}

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export default async function Home() {
  const clerkUser = await getCurrentContourUser();
  const workspaceName =
    clerkUser?.fullName ??
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ??
    "Guest developer";
  const workspaceEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "Workspace unavailable";
  const dashboardSnapshot = await (async () => {
    try {
      return await getContourDashboardSnapshot();
    } catch {
      return null;
    }
  })();

  const counts = dashboardSnapshot?.counts;
  const metrics = dashboardSnapshot?.metrics;

  const tableCountCards = counts
    ? [
        { label: "Users", value: counts.users, icon: Users },
        { label: "Listings", value: counts.listings, icon: HomeIcon },
        { label: "Clients", value: counts.clients, icon: Users },
        { label: "Deals", value: counts.deals, icon: LineChart },
        { label: "Work items", value: counts.workItems, icon: Database },
        { label: "Insights", value: counts.insights, icon: Sparkles },
        { label: "Payments", value: counts.payments, icon: Banknote },
        { label: "Documents", value: counts.documents, icon: FileText },
      ]
    : [];

  const supportCountRows = counts
    ? [
        ["Listing utilities", counts.listingUtilities],
        ["Preferred locations", counts.clientPreferredLocations],
        ["Deal listings", counts.dealListings],
        ["Interactions", counts.interactions],
        ["Payment plans", counts.paymentPlans],
        ["Schedule items", counts.installmentScheduleItems],
        ["Rental charges", counts.rentalCharges],
        ["Sync state rows", counts.syncState],
      ]
    : [];

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:color-mix(in_oklab,var(--surface)_96%,white)] p-4 shadow-[0_18px_50px_rgba(39,26,0,0.06)] lg:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <Sparkles className="size-3.5" />
              Live dashboard
            </div>
            <h1 className="mt-4 text-[clamp(2rem,2.4vw,3.4rem)] font-semibold tracking-[-0.04em]">
              Contour Analytics Engine
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[color:var(--muted)]">
              A compact view of the business: table counts, key portfolio value, open pipeline, and the minimum operational status needed to keep moving.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/listings/new"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] bg-[color:var(--primary)] px-4 text-[13px] font-medium text-[color:var(--primary-foreground)] transition-transform duration-150 hover:-translate-y-0.5"
            >
              <Plus className="size-4" />
              New listing
            </Link>
            <Link
              href="/deals/new"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <Plus className="size-4" />
              New deal
            </Link>
            <Link
              href="/deals"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <ArrowUpRight className="size-4" />
              Open deals
            </Link>
            <Link
              href="/activity"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <Workflow className="size-4" />
              Activity
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--muted)]">
            <p className="text-[11px] uppercase tracking-[0.26em]">Data status</p>
            <p className="mt-1 text-[13px]">
              {counts
                ? `${counts.listings} listings, ${counts.clients} clients, ${counts.deals} deals, and ${counts.workItems} work items are loaded.`
                : "Loading live dashboard snapshot..."}
            </p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.26em] text-[color:var(--muted)]">Workspace</p>
            <p className="mt-1 text-[13px] font-medium">{workspaceName}</p>
            <p className="mt-1 text-[11px] text-[color:var(--muted)]">{workspaceEmail}</p>
          </div>
        </div>
      </header>

      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Key metrics</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Portfolio and work snapshot</h2>
          </div>
          <Link
            href="/clients"
            className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 text-[12px] font-medium"
          >
            <ArrowUpRight className="size-4" />
            Open routes
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Portfolio value</p>
            <p className="mt-2 text-[18px] font-semibold">{formatMoney(metrics?.portfolioValueCents ?? 0, "ZMW")}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Open deal value</p>
            <p className="mt-2 text-[18px] font-semibold">{formatMoney(metrics?.openDealValueCents ?? 0, "ZMW")}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Open insights</p>
            <p className="mt-2 text-[18px] font-semibold">{metrics?.openInsights ?? 0}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Open work items</p>
            <p className="mt-2 text-[18px] font-semibold">{metrics?.overdueWorkItems ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Table counts</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Core tables</h2>
            </div>
            <Database className="size-5 text-[color:var(--muted)]" />
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-[color:var(--border)]">
            <table className="min-w-full border-collapse text-left text-[13px]">
              <tbody>
                {tableCountCards.map((card, index) => (
                  <tr key={card.label} className={index !== tableCountCards.length - 1 ? "border-b border-[color:var(--border)]" : ""}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <card.icon className="size-4 text-[color:var(--muted)]" />
                        <span className="font-medium">{card.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold">{card.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Support tables</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Related data</h2>
            </div>
            <Database className="size-5 text-[color:var(--muted)]" />
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-[color:var(--border)]">
            <table className="min-w-full border-collapse text-left text-[13px]">
              <tbody>
                {supportCountRows.map(([label, value], index) => (
                  <tr key={label} className={index !== supportCountRows.length - 1 ? "border-b border-[color:var(--border)]" : ""}>
                    <td className="px-4 py-3.5 font-medium">{label}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </WorkspaceShell>
  );
}
