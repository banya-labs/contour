import "../../../lib/load-contour-env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../../components/workspace-shell";

export const dynamic = "force-dynamic";

type ClientPageProps = {
  params: {
    id: string;
  };
};

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

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const prisma = getPrismaClient();
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      preferredLocations: true,
      deals: {
        include: {
          listing: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      interactions: {
        include: {
          listing: { select: { title: true } },
          deal: { select: { title: true } },
          agentUser: { select: { fullName: true } },
        },
        orderBy: { interactionAt: "desc" },
      },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1200px] space-y-4">
        <Link
          href="/clients"
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Client profile</p>
              <h1 className="mt-2 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">{client.fullName}</h1>
              <p className="mt-3 text-[14px] text-[color:var(--muted)]">
                {client.email ?? "No email"} · {client.phone ?? "No phone"}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[12px] font-medium">
              <Users className="size-4 text-[color:var(--muted)]" />
              {client.status}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Segment</p>
              <p className="mt-2 text-[14px] font-medium">{client.segment ?? "Unset"}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Preferred location</p>
              <p className="mt-2 text-[14px] font-medium">{client.preferredLocations[0]?.locationArea ?? "Unset"}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Budget</p>
              <p className="mt-2 text-[14px] font-medium">
                {formatMoney(client.budgetMinAmount === null ? null : Number(client.budgetMinAmount), client.budgetCurrency ?? null)}
                {" - "}
                {formatMoney(client.budgetMaxAmount === null ? null : Number(client.budgetMaxAmount), client.budgetCurrency ?? null)}
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Deals</p>
              <p className="mt-2 text-[14px] font-medium">{client.deals.length}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Compliance</p>
              <h2 className="mt-2 text-[18px] font-semibold">KYC vault</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[12px] text-[color:var(--muted)]">
              <ShieldCheck className="size-4 text-[color:var(--success)]" />
              Restricted fields
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">NRC / Passport</p>
              <p className="mt-2 text-[14px] font-medium">{client.nrcNumber ?? client.passportNumber ?? "Unset"}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">TPIN</p>
              <p className="mt-2 text-[14px] font-medium">{client.tpin ?? "Unset"}</p>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-[color:var(--muted)]">
            These fields are part of the PRD compliance vault and should be restricted by role once auth enforcement is wired through the UI layer.
          </p>
        </section>

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Timeline</p>
              <h2 className="mt-2 text-[18px] font-semibold">Interaction history</h2>
            </div>
            <Link
              href="/activity"
              className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 text-[12px] font-medium"
            >
              View activity
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {client.interactions.length ? (
              client.interactions.map((interaction) => (
                <article
                  key={interaction.id}
                  className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-medium">{interaction.type.replaceAll("_", " ")}</p>
                      <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                        {new Date(interaction.interactionAt).toLocaleString()} · {interaction.agentUser.fullName ?? "Unassigned"}
                      </p>
                    </div>
                    <div className="text-right text-[12px] text-[color:var(--muted)]">
                      <p>{interaction.listing?.title ?? "No listing"}</p>
                      <p className="mt-1">{interaction.deal?.title ?? "No deal"}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-[color:var(--foreground)]">{interaction.summary}</p>
                  <p className="mt-2 text-[12px] text-[color:var(--muted)]">
                    {interaction.outcome ?? "No outcome"}{interaction.nextStep ? ` · Next step: ${interaction.nextStep}` : ""}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-[13px] text-[color:var(--muted)]">No interactions logged yet.</p>
            )}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
