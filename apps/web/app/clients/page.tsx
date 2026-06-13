import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../components/workspace-shell";

export const dynamic = "force-dynamic";

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || currency === null) {
    return "Unset";
  }

  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export default async function ClientsPage() {
  const prisma = getPrismaClient();
  const [clients, totalClients, activeClients, recentInteractions] = await Promise.all([
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        preferredLocations: true,
        deals: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.client.count(),
    prisma.client.count({ where: { status: "active" } }),
    prisma.interaction.count(),
  ]);

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <Users className="size-3.5" />
              Clients
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Client registry</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Every client, their preferred location, deal count, and budget band in one working view.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
          >
            <ArrowUpRight className="size-4" />
            Dashboard
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Total clients</p>
            <p className="mt-2 text-[18px] font-semibold">{totalClients}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Active clients</p>
            <p className="mt-2 text-[18px] font-semibold">{activeClients}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Interactions logged</p>
            <p className="mt-2 text-[18px] font-semibold">{recentInteractions}</p>
          </div>
        </div>
      </header>

      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="overflow-hidden rounded-[22px] border border-[color:var(--border)]">
          <table className="min-w-full border-collapse text-left text-[13px]">
            <thead className="bg-[color:var(--surface-muted)] text-[color:var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Segment</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Preferred location</th>
                <th className="px-4 py-3 font-medium">Deals</th>
              </tr>
            </thead>
            <tbody>
              {clients.length ? (
                clients.map((client, index) => (
                  <tr key={client.id} className={index !== clients.length - 1 ? "border-b border-[color:var(--border)]" : ""}>
                    <td className="px-4 py-3.5">
                      <div className="font-medium">{client.fullName}</div>
                      <div className="mt-1 text-[11px] text-[color:var(--muted)]">{client.email ?? client.phone ?? "No contact"}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[color:var(--muted)]">{client.status}</td>
                    <td className="px-4 py-3.5 text-[color:var(--muted)]">{client.segment ?? "Unset"}</td>
                    <td className="px-4 py-3.5 text-[color:var(--muted)]">
                      {formatMoney(client.budgetMinAmount === null ? null : Number(client.budgetMinAmount), client.budgetCurrency ?? null)} - {formatMoney(client.budgetMaxAmount === null ? null : Number(client.budgetMaxAmount), client.budgetCurrency ?? null)}
                    </td>
                    <td className="px-4 py-3.5 text-[color:var(--muted)]">
                      {client.preferredLocations[0]?.locationArea ?? "Unset"}
                    </td>
                    <td className="px-4 py-3.5 text-[color:var(--muted)]">{client.deals.length}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-[13px] text-[color:var(--muted)]" colSpan={6}>
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </WorkspaceShell>
  );
}
