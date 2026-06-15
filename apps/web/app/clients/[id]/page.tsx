import "../../../lib/load-contour-env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3, Users } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../../components/workspace-shell";

export const dynamic = "force-dynamic";

type ClientPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { id } = await params;
  const prisma = getPrismaClient();
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      deals: {
        select: {
          id: true,
        },
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[12px] font-medium">
                <Users className="size-4 text-[color:var(--muted)]" />
                {client.status}
              </div>
              <Link
                href={`/clients/${client.id}/edit`}
                className="inline-flex h-10 items-center gap-2 rounded-[999px] bg-[color:var(--primary)] px-4 text-[13px] font-medium text-[color:var(--primary-foreground)] transition-transform duration-150 hover:-translate-y-0.5"
              >
                <Edit3 className="size-4" />
                Edit client
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Source</p>
              <p className="mt-2 text-[14px] font-medium">{client.source ?? "Unset"}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Deals</p>
              <p className="mt-2 text-[14px] font-medium">{client.deals.length}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Profile status</p>
              <p className="mt-2 text-[14px] font-medium">{client.status}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Compliance</p>
          <h2 className="mt-2 text-[18px] font-semibold">Sensitive fields</h2>
          <p className="mt-3 text-[13px] text-[color:var(--muted)]">
            This schema currently only stores the public client record. KYC fields can be added once the database model is expanded.
          </p>
        </section>

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Actions</p>
          <h2 className="mt-2 text-[18px] font-semibold">Linked work</h2>
          <p className="mt-3 text-[13px] text-[color:var(--muted)]">
            Open the edit screen to update the record, or return to the registry to keep working the queue.
          </p>
        </section>
      </div>
    </WorkspaceShell>
  );
}
