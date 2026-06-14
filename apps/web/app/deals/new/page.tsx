import "../../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { DealForm } from "../../../components/deal-form";
import { WorkspaceShell } from "../../../components/workspace-shell";

export const dynamic = "force-dynamic";

const initialValues = {
  title: "",
  stage: "new",
  status: "open",
  value: "",
  currency: "ZMW",
  listingId: "",
  clientId: "",
};

export default async function NewDealPage() {
  const prisma = getPrismaClient();
  const [listings, clients] = await Promise.all([
    prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
      },
    }),
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        fullName: true,
      },
    }),
  ]);

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

        <DealForm
          submitLabel="Create deal"
          initialValues={initialValues}
          cancelHref="/deals"
          heading="Create deal"
          description="Start a new pipeline record and connect it to the listing and client that it belongs to."
          listings={listings.map((listing) => ({ id: listing.id, label: listing.title }))}
          clients={clients.map((client) => ({ id: client.id, label: client.fullName }))}
        />
      </div>
    </WorkspaceShell>
  );
}
