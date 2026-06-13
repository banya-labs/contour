import "../lib/load-contour-env";
import Link from "next/link";
import { Search, Plus, ArrowUpRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import {
  bootstrapContourClerkEnv,
  contourBrand,
  contourCockpits,
  contourNavigation,
} from "@contour/config";
import {
  checkContourDatabaseConnection,
  getContourDashboardSnapshot,
  ensureContourWorkspaceProfile,
  getContourDatabaseStatus,
  getContourWorkspaceSnapshot,
} from "@contour/db";
import { ContourMark } from "../components/contour-mark";
import { UserMenu } from "../components/user-menu";

export const dynamic = "force-dynamic";

const authConfig = bootstrapContourClerkEnv();
const clerkKeysConfigured = authConfig.isConfigured;

const portfolioRows = [
  { name: "Lusaka West 14", type: "Property", status: "Available", price: "ZMW 1.8M", owner: "M. Chanda" },
  { name: "Woodlands 09", type: "Property", status: "Reserved", price: "USD 185K", owner: "N. Banda" },
  { name: "Ndola North 24", type: "Vacant land", status: "Under maintenance", price: "ZMW 460K", owner: "Estate Trust" },
  { name: "Livingstone Plot 88", type: "Vacant land", status: "Sold", price: "USD 52K", owner: "T. Phiri" },
];

const revenueRows = [
  { label: "Installment plans", value: "18 active", note: "6 overdue" },
  { label: "Rental leases", value: "31 active", note: "11 arrears" },
  { label: "Expected this month", value: "ZMW 840K", note: "82% collected" },
  { label: "Receipts logged", value: "ZMW 690K", note: "Manual intake" },
];

const workRows = [
  { title: "Verify title deed for Lusaka West 14", kind: "Document request", tone: "warning" },
  { title: "Follow up on Woodlands 09 viewing", kind: "Follow-up", tone: "info" },
  { title: "Review duplicate client suspicion", kind: "Audit check", tone: "danger" },
  { title: "Resolve sync failure on desktop device", kind: "Sync health", tone: "info" },
];

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
      return "success";
    case "reserved":
    case "negotiating":
    case "in_progress":
    case "open":
      return "warning";
    case "sold":
    case "closed_lost":
    case "lost":
    case "blocked":
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
  const clerkUser = await currentUser();
  const databaseStatus = await checkContourDatabaseConnection();
  const databaseConfig = getContourDatabaseStatus();
  const workspaceName =
    clerkUser?.fullName ??
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ??
    "Signed-in user";
  const workspaceEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "No email available";
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
  const dashboardSnapshot = clerkUser && canQueryDatabase
    ? await (async () => {
        try {
          return await getContourDashboardSnapshot();
        } catch {
          return null;
        }
      })()
    : null;
  const workspaceRole = workspaceSnapshot?.profile?.role ?? "unassigned";
  const liveListings = dashboardSnapshot?.listings ?? [];
  const liveClients = dashboardSnapshot?.clients ?? [];
  const liveDeals = dashboardSnapshot?.deals ?? [];
  const liveWorkItems = dashboardSnapshot?.workItems ?? [];
  const latestDeal = liveDeals[0];
  const latestClient = liveClients[0];
  const latestWorkItem = liveWorkItems[0];

  return (
    <div className="min-h-screen px-4 py-4 text-[color:var(--foreground)] lg:px-6 lg:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] gap-4 lg:gap-5">
        <aside className="hidden w-[290px] flex-col rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[0_18px_50px_rgba(39,26,0,0.07)] lg:flex">
          <div className="flex items-center gap-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-3">
            <div className="flex size-12 items-center justify-center rounded-[16px] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
              <ContourMark className="size-7" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Contour</p>
              <p className="text-[15px] font-semibold">{contourBrand.name}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Status</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium">Online sync healthy</p>
                <p className="text-[12px] text-[color:var(--muted)]">Last sync 2 min ago</p>
              </div>
              <span className="rounded-full border border-[color:rgba(47,109,68,0.20)] bg-[color:rgba(47,109,68,0.08)] px-3 py-1 text-[11px] font-medium text-[color:var(--success)]">Online</span>
            </div>
          </div>

          <nav className="mt-4 flex flex-1 flex-col gap-3">
            {contourNavigation.map((section) => (
              <section key={section.label} className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.26em] text-[color:var(--muted)]">{section.label}</p>
                <div className="space-y-1">
                  {section.items.map((item, index) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between rounded-[14px] px-3 py-2 text-[13px] ${
                        section.label === "Portfolio" && index === 0
                          ? "bg-[color:rgba(39,26,0,0.08)] font-medium"
                          : "text-[color:var(--foreground)]"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight className="size-3.5 text-[color:var(--muted)]" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </nav>

          <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <div className="flex items-center gap-2 text-[12px] font-medium">
              <ShieldCheck className="size-4 text-[color:var(--success)]" />
              Access locked by role
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[color:var(--muted)]">
              Admin, agent, finance, legal, and auditor views stay separated through shared policy.
            </p>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:color-mix(in_oklab,var(--surface)_96%,white)] p-4 shadow-[0_18px_50px_rgba(39,26,0,0.06)] lg:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
                  <Sparkles className="size-3.5" />
                  High-end real estate operating system
                </div>
                {!clerkKeysConfigured ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[color:rgba(148,98,29,0.2)] bg-[color:rgba(148,98,29,0.08)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.26em] text-[color:var(--warning)]">
                    Clerk keys not configured
                    <Link href="/sign-in" className="underline underline-offset-4">
                      Enable auth
                    </Link>
                  </div>
                ) : null}
                <p className="mt-4 text-[11px] uppercase tracking-[0.26em] text-[color:var(--muted)]">
                  {clerkKeysConfigured ? "Clerk enabled" : "Guest mode"}
                </p>
                <h1 className="mt-4 text-[clamp(2rem,2.4vw,3.4rem)] font-semibold tracking-[-0.04em]">
                  Contour Analytics Engine
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[color:var(--muted)]">
                  Portfolio, revenue, and action in one cockpit. Built for field agents, finance teams, legal review, and owners who need the business to keep moving offline.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className="inline-flex h-11 items-center gap-2 rounded-[999px] bg-[color:var(--primary)] px-4 text-[13px] font-medium text-[color:var(--primary-foreground)] transition-transform duration-150 hover:-translate-y-0.5">
                  <Plus className="size-4" />
                  New listing
                </button>
                <button className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-muted)]">
                  <Zap className="size-4" />
                  Open work queue
                </button>
                <div className="rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-1">
                  {clerkKeysConfigured ? (
                    <UserMenu />
                  ) : (
                    <span className="px-3 text-[12px] font-medium text-[color:var(--muted)]">
                      Guest mode
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.9fr)_minmax(220px,0.75fr)]">
              <label className="flex h-12 items-center gap-3 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[color:var(--muted)]">
                <Search className="size-4 shrink-0" />
                <span className="text-[13px]">Search listings, clients, deals, work items</span>
              </label>
              <div className="flex items-center justify-between rounded-[18px] border border-[color:rgba(47,109,68,0.18)] bg-[color:rgba(47,109,68,0.06)] px-4 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--success)]">Connectivity</p>
                  <p className="mt-1 text-[13px] font-medium">Online and synced</p>
                </div>
                <span className="rounded-full bg-[color:rgba(47,109,68,0.12)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--success)]">Live</span>
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
                <p className="mt-1 text-[13px] font-medium">
                  {workspaceName}
                </p>
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
                  Role: {workspaceRole}
                </p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.26em] text-[color:var(--muted)]">DB config</p>
                <p className="mt-1 text-[13px] font-medium">
                  {databaseConfig.configured ? "Loaded from env" : "Missing"}
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--muted)]">
                  {databaseStatus.connected
                    ? `${dashboardSnapshot?.counts.listings ?? 0} listings / ${dashboardSnapshot?.counts.deals ?? 0} deals`
                    : databaseStatus.message}
                </p>
              </div>
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[28px] border border-[color:rgba(39,26,0,0.16)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Authenticated workspace</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">
                {workspaceSnapshot?.needsProvisioning
                  ? "Your Neon profile row is not provisioned yet"
                  : "Your workspace profile is live"}
              </h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
                This panel is now backed by the current Clerk session and Neon data.
                It is the first real slice of the app shell and will become the anchor
                for listings, clients, deals, and task queues.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <p className="text-[11px] text-[color:var(--muted)]">Clerk user ID</p>
                  <p className="mt-2 break-all text-[14px] font-medium">
                    {workspaceSnapshot?.clerkUserId ?? "No session"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <p className="text-[11px] text-[color:var(--muted)]">Workspace role</p>
                  <p className="mt-2 text-[14px] font-medium">
                    {workspaceSnapshot?.profile?.role ?? "No profile yet"}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Recent activity</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Latest Neon events</h2>
              <div className="mt-4 space-y-3">
                {workspaceSnapshot?.recentEvents.length ? (
                  workspaceSnapshot.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3"
                    >
                      <p className="text-[13px] font-medium">{event.eventType}</p>
                      <p className="mt-1 text-[11px] text-[color:var(--muted)]">
                        {event.entityType}
                        {event.entityId ? ` • ${event.entityId}` : ""} • {new Date(event.occurredAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-8 text-center">
                    <p className="text-[13px] font-medium">No workspace events yet</p>
                    <p className="mt-2 text-[12px] text-[color:var(--muted)]">
                      The first database record will appear here once we start
                      creating listings, clients, or work items.
                    </p>
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            {contourCockpits.map((cockpit, index) => (
              <article
                key={cockpit.key}
                className={`rounded-[28px] border p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)] ${
                  index === 0
                    ? "border-[color:rgba(39,26,0,0.16)] bg-[color:var(--surface)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface)]"
                }`}
              >
                <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">{cockpit.label}</p>
                <p className="mt-3 text-[15px] font-semibold">{cockpit.summary}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                    <p className="text-[11px] text-[color:var(--muted)]">Primary focus</p>
                    <p className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">
                      {cockpit.key === "portfolio" ? "Inventory health" : cockpit.key === "revenue" ? "Receivables" : "Resolution"}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                    <p className="text-[11px] text-[color:var(--muted)]">Next action</p>
                    <p className="mt-2 text-[14px] font-medium leading-6">
                      {cockpit.key === "portfolio"
                        ? "Review stale listings"
                        : cockpit.key === "revenue"
                          ? "Collect overdue receipts"
                          : "Clear top work items"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Portfolio watchlist</p>
                  <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Listings, status, and ownership</h2>
                </div>
                <button className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 text-[12px] font-medium">
                  <ArrowUpRight className="size-4" />
                  See all
                </button>
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
                    {liveListings.length ? (
                      liveListings.map((row, index) => (
                        <tr key={row.id} className={index !== liveListings.length - 1 ? "border-b border-[color:var(--border)]" : ""}>
                          <td className="px-4 py-3.5 font-medium">{row.title}</td>
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
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Revenue snapshot</p>
                    <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Collections and arrears</h2>
                  </div>
                  <ArrowUpRight className="size-4 text-[color:var(--muted)]" />
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="flex items-center justify-between rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                    <div>
                      <p className="text-[12px] text-[color:var(--muted)]">Active deals</p>
                      <p className="mt-1 text-[15px] font-semibold">{dashboardSnapshot?.counts.deals ?? 0}</p>
                    </div>
                    <p className="text-[12px] font-medium text-[color:var(--muted)]">
                      {latestDeal ? `${latestDeal.stage} • ${formatMoney(latestDeal.valueCents, latestDeal.currency)}` : "No active deal yet"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                    <div>
                      <p className="text-[12px] text-[color:var(--muted)]">Clients tracked</p>
                      <p className="mt-1 text-[15px] font-semibold">{dashboardSnapshot?.counts.clients ?? 0}</p>
                    </div>
                    <p className="text-[12px] font-medium text-[color:var(--muted)]">
                      {latestClient?.source ?? "No source yet"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                    <div>
                      <p className="text-[12px] text-[color:var(--muted)]">Pipeline value</p>
                      <p className="mt-1 text-[15px] font-semibold">
                        {formatMoney(
                          liveDeals.reduce((sum, deal) => sum + deal.valueCents, 0),
                          liveDeals[0]?.currency ?? "ZMW",
                        )}
                      </p>
                    </div>
                    <p className="text-[12px] font-medium text-[color:var(--muted)]">Live from Neon</p>
                  </div>
                </div>
              </article>

              <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Document control</p>
                <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Compliance pressure points</h2>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                    <p className="text-[12px] text-[color:var(--muted)]">Open work items</p>
                    <p className="mt-1 text-[15px] font-semibold">{dashboardSnapshot?.counts.workItems ?? 0} tasks waiting on action</p>
                  </div>
                  <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                    <p className="text-[12px] text-[color:var(--muted)]">Top task</p>
                    <p className="mt-1 text-[15px] font-semibold">
                      {latestWorkItem ? latestWorkItem.title : "No work items yet"}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Action queue</p>
                  <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Open work from insights</h2>
                </div>
                <ShieldCheck className="size-5 text-[color:var(--success)]" />
              </div>

              <div className="mt-4 space-y-3">
                {liveWorkItems.length ? (
                  liveWorkItems.map((row) => (
                    <div key={row.id} className="flex items-start justify-between gap-4 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                      <div className="min-w-0">
                        <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${pillClass(normalizeTone(row.tone))}`}>{row.kind.replaceAll("_", " ")}</div>
                        <p className="mt-2 text-[14px] font-medium leading-6">{row.title}</p>
                      </div>
                      <button className="mt-0.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-[12px] font-medium">
                        {row.status.replaceAll("_", " ")}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-8 text-center">
                    <p className="text-[13px] font-medium">No work items yet</p>
                    <p className="mt-2 text-[12px] text-[color:var(--muted)]">
                      Task queues will appear here once the first operational workflow is created.
                    </p>
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">System notes</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Contour operating principles</h2>
              <div className="mt-4 space-y-3 text-[13px] leading-6 text-[color:var(--muted)]">
                <p>{dashboardSnapshot?.counts.listings ?? 0} listings, {dashboardSnapshot?.counts.clients ?? 0} clients, and {dashboardSnapshot?.counts.deals ?? 0} deals are now queryable from Neon.</p>
                <p>Offline mode is still a real working state, not an error page. Desktop writes queue locally and sync later.</p>
                <p>Money records stay append-only or correction-based. KYC data stays restricted by role and audited.</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <p className="text-[11px] text-[color:var(--muted)]">Lineage</p>
                  <p className="mt-2 text-[14px] font-medium">
                    {workspaceSnapshot?.profile?.role ? `Current role: ${workspaceSnapshot.profile.role}` : "Notion docs are now the product source of truth"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <p className="text-[11px] text-[color:var(--muted)]">Next build</p>
                  <p className="mt-2 text-[14px] font-medium">Seed tables and wire create/edit flows for listings and deals</p>
                </div>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
