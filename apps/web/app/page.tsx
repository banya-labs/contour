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
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import {
  checkContourDatabaseConnection,
  ensureContourWorkspaceProfile,
  getContourDatabaseStatus,
  getContourDashboardSnapshot,
  getContourWorkspaceSnapshot,
} from "@contour/db";
import { WorkspaceShell } from "../components/workspace-shell";

export const dynamic = "force-dynamic";

const clerkKeysConfigured = false;

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

function normalizeTone(value: string) {
  switch (value) {
    case "available":
    case "active":
    case "won":
    case "done":
    case "resolved":
      return "success";
    case "reserved":
    case "negotiating":
    case "in_progress":
    case "open":
    case "acknowledged":
      return "warning";
    case "sold":
    case "closed_lost":
    case "lost":
    case "blocked":
    case "critical":
    case "danger":
      return "danger";
    default:
      return "info";
  }
}

function pillClass(tone: string) {
  switch (tone) {
    case "warning":
      return "bg-[color:rgba(148,98,29,0.12)] text-[color:var(--warning)]";
    case "danger":
      return "bg-[color:rgba(141,43,31,0.10)] text-[color:var(--danger)]";
    case "success":
      return "bg-[color:rgba(47,109,68,0.10)] text-[color:var(--success)]";
    default:
      return "bg-[color:rgba(93,90,132,0.10)] text-[color:var(--info)]";
  }
}

export default async function Home() {
  const clerkUser = await getCurrentContourUser();
  const databaseStatus = await checkContourDatabaseConnection();
  const databaseConfig = getContourDatabaseStatus();
  const workspaceName =
    clerkUser?.fullName ??
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ??
    "Guest developer";
  const workspaceEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "Auth disabled";
  const canQueryDatabase = databaseStatus.connected;

  const workspaceSnapshot = clerkUser && canQueryDatabase
    ? await (async () => {
        try {
          await ensureContourWorkspaceProfile({
            clerkUserId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
            fullName: workspaceName,
          });

          return getContourWorkspaceSnapshot(clerkUser.id);
        } catch {
          return null;
        }
      })()
    : null;
  const dashboardSnapshot = canQueryDatabase
    ? await (async () => {
        try {
          return await getContourDashboardSnapshot();
        } catch {
          return null;
        }
      })()
    : null;

  const counts = dashboardSnapshot?.counts;
  const metrics = dashboardSnapshot?.metrics;
  const latestListing = dashboardSnapshot?.listings[0];
  const latestClient = dashboardSnapshot?.clients[0];
  const latestDeal = dashboardSnapshot?.deals[0];
  const latestWorkItem = dashboardSnapshot?.workItems[0];
  const latestInsight = dashboardSnapshot?.insights[0];

  const tableCountCards = counts
    ? [
        { label: "Users", value: counts.users, icon: Users },
        { label: "Listings", value: counts.listings, icon: HomeIcon },
        { label: "Clients", value: counts.clients, icon: Users },
        { label: "Deals", value: counts.deals, icon: LineChart },
        { label: "Work items", value: counts.workItems, icon: Workflow },
        { label: "Insights", value: counts.insights, icon: Sparkles },
        { label: "Payments", value: counts.payments, icon: Banknote },
        { label: "Documents", value: counts.documents, icon: FileText },
        { label: "Events", value: counts.events, icon: Database },
        { label: "Audit logs", value: counts.auditLogs, icon: ShieldCheck },
        { label: "Leases", value: counts.rentalLeases, icon: Home },
        { label: "Sync devices", value: counts.syncDevices, icon: Database },
      ]
    : [];

  const supportCountCards = counts
    ? [
        { label: "Listing utilities", value: counts.listingUtilities },
        { label: "Preferred locations", value: counts.clientPreferredLocations },
        { label: "Deal listings", value: counts.dealListings },
        { label: "Interactions", value: counts.interactions },
        { label: "Payment plans", value: counts.paymentPlans },
        { label: "Schedule items", value: counts.installmentScheduleItems },
        { label: "Rental charges", value: counts.rentalCharges },
        { label: "Sync state rows", value: counts.syncState },
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
            {!clerkKeysConfigured ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[color:rgba(148,98,29,0.2)] bg-[color:rgba(148,98,29,0.08)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.26em] text-[color:var(--warning)]">
                Auth bypass active for local development
              </div>
            ) : null}
            <p className="mt-4 text-[11px] uppercase tracking-[0.26em] text-[color:var(--muted)]">
              {clerkKeysConfigured ? "Clerk enabled" : "Guest mode"}
            </p>
            <h1 className="mt-4 text-[clamp(2rem,2.4vw,3.4rem)] font-semibold tracking-[-0.04em]">
              Contour Analytics Engine
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[color:var(--muted)]">
              One view for portfolio health, revenue flow, work queues, sync state, and document coverage.
              It is deliberately compact so the key numbers are obvious before you drill into a route.
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
              href="/deals"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <ArrowUpRight className="size-4" />
              Open deals
            </Link>
            <div className="rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-1">
              <span className="px-3 text-[12px] font-medium text-[color:var(--muted)]">
                {databaseStatus.connected ? "Neon connected" : "DB offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.9fr)_minmax(220px,0.75fr)]">
          <div className="flex h-12 items-center gap-3 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[color:var(--muted)]">
            <Database className="size-4 shrink-0" />
            <span className="text-[13px]">
              {counts
                ? `${counts.listings} listings, ${counts.clients} clients, ${counts.deals} deals, ${counts.workItems} work items, and ${counts.insights} insights are loaded.`
                : "Loading live dashboard snapshot..."}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-[18px] border border-[color:rgba(47,109,68,0.18)] bg-[color:rgba(47,109,68,0.06)] px-4 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--success)]">Connectivity</p>
              <p className="mt-1 text-[13px] font-medium">Online and synced</p>
            </div>
            <span className="rounded-full bg-[color:rgba(47,109,68,0.12)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--success)]">
              Live
            </span>
          </div>
          <div className="flex items-center justify-between rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--muted)]">Workspace</p>
              <p className="mt-1 text-[13px] font-medium">Lusaka office</p>
            </div>
            <p className="text-[11px] text-[color:var(--muted)]">ZMW / USD</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.26em] text-[color:var(--muted)]">Auth</p>
            <p className="mt-1 text-[13px] font-medium">{workspaceName}</p>
            <p className="mt-1 text-[11px] text-[color:var(--muted)]">{workspaceEmail}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.26em] text-[color:var(--muted)]">Neon</p>
            <p className="mt-1 text-[13px] font-medium">
              {workspaceSnapshot
                ? workspaceSnapshot.needsProvisioning
                  ? "Profile missing"
                  : "Profile loaded"
                : "Awaiting session"}
            </p>
            <p className="mt-1 text-[11px] text-[color:var(--muted)]">
              Role: {workspaceSnapshot?.profile?.role ?? "unassigned"}
            </p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.26em] text-[color:var(--muted)]">DB config</p>
            <p className="mt-1 text-[13px] font-medium">
              {databaseConfig.configured ? "Loaded from env" : "Missing"}
            </p>
            <p className="mt-1 text-[11px] text-[color:var(--muted)]">
              {databaseStatus.connected ? "Live Neon data is available" : databaseStatus.message}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[28px] border border-[color:rgba(39,26,0,0.16)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Operational pulse</p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Key dashboard metrics</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Portfolio value</p>
              <p className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">
                {formatMoney(metrics?.portfolioValueCents ?? 0, "ZMW")}
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Open deal value</p>
              <p className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">
                {formatMoney(metrics?.openDealValueCents ?? 0, "ZMW")}
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Open insights</p>
              <p className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">
                {metrics?.openInsights ?? 0}
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Work still open</p>
              <p className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">
                {metrics?.overdueWorkItems ?? 0}
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Active leases</p>
              <p className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">
                {metrics?.activeLeases ?? 0}
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Verified docs</p>
              <p className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">
                {metrics?.verifiedDocuments ?? 0}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Latest activity</p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Recent records</h2>
          <div className="mt-4 space-y-3">
            {latestListing ? (
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[13px] font-medium">Latest listing</p>
                <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                  {latestListing.title} - {latestListing.propertyType}
                </p>
              </div>
            ) : null}
            {latestClient ? (
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[13px] font-medium">Latest client</p>
                <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                  {latestClient.fullName} - {latestClient.status}
                </p>
              </div>
            ) : null}
            {latestDeal ? (
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[13px] font-medium">Latest deal</p>
                <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                  {latestDeal.title} - {latestDeal.stage}
                </p>
              </div>
            ) : null}
            {latestWorkItem ? (
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[13px] font-medium">Latest work item</p>
                <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                  {latestWorkItem.title} - {latestWorkItem.status}
                </p>
              </div>
            ) : null}
            {latestInsight ? (
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[13px] font-medium">Latest insight</p>
                <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                  {latestInsight.title} - {latestInsight.severity}
                </p>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Database coverage</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Record counts by table</h2>
          </div>
          <Link
            href="/clients"
            className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 text-[12px] font-medium"
          >
            <ArrowUpRight className="size-4" />
            Open routes
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tableCountCards.map((card) => (
            <div key={card.label} className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--muted)]">{card.label}</p>
                <card.icon className="size-4 text-[color:var(--muted)]" />
              </div>
              <p className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {supportCountCards.map((card) => (
            <div key={card.label} className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <p className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--muted)]">{card.label}</p>
              <p className="mt-2 text-[16px] font-semibold">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Portfolio watchlist</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Listings and ownership</h2>
            </div>
            <Link
              href="/listings"
              className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 text-[12px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              See all
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-[color:var(--border)]">
            <table className="min-w-full border-collapse text-left text-[13px]">
              <thead className="bg-[color:var(--surface-muted)] text-[color:var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {dashboardSnapshot?.listings.length ? (
                  dashboardSnapshot.listings.map((row, index) => (
                    <tr
                      key={row.id}
                      className={index !== dashboardSnapshot.listings.length - 1 ? "border-b border-[color:var(--border)]" : ""}
                    >
                      <td className="px-4 py-3.5 font-medium">
                        <Link href={`/listings/${row.id}`} className="underline-offset-4 hover:underline">
                          {row.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-[color:var(--muted)]">{row.propertyType}</td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${pillClass(normalizeTone(row.status))}`}>
                          {row.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{formatMoney(row.priceCents, row.currency)}</td>
                      <td className="px-4 py-3.5 text-[color:var(--muted)]">{row.ownerName ?? "Unassigned"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-[13px] text-[color:var(--muted)]" colSpan={5}>
                      No listings yet. Seed data or create your first property to populate the portfolio watchlist.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <div className="grid gap-4">
          <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Revenue snapshot</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Collections and deal flow</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[12px] text-[color:var(--muted)]">Open deals</p>
                <p className="mt-1 text-[15px] font-semibold">{counts?.deals ?? 0}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[12px] text-[color:var(--muted)]">Open deal value</p>
                <p className="mt-1 text-[15px] font-semibold">{formatMoney(metrics?.openDealValueCents ?? 0, "ZMW")}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[12px] text-[color:var(--muted)]">Clients tracked</p>
                <p className="mt-1 text-[15px] font-semibold">{counts?.clients ?? 0}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Action queue</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Work and insight pressure</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[12px] text-[color:var(--muted)]">Open work items</p>
                <p className="mt-1 text-[15px] font-semibold">{metrics?.overdueWorkItems ?? 0}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[12px] text-[color:var(--muted)]">Open insights</p>
                <p className="mt-1 text-[15px] font-semibold">{metrics?.openInsights ?? 0}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[12px] text-[color:var(--muted)]">Last sync</p>
                <p className="mt-1 text-[15px] font-semibold">
                  {metrics?.lastSyncAt ? new Date(metrics.lastSyncAt).toLocaleString() : "No sync recorded"}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </WorkspaceShell>
  );
}
