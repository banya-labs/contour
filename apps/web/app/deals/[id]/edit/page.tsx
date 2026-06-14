import "../../../../lib/load-contour-env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getContourDeal, getPrismaClient } from "@contour/db";
import { DealForm } from "../../../../components/deal-form";
import { WorkspaceShell } from "../../../../components/workspace-shell";

export const dynamic = "force-dynamic";

const fallbackValues = {
  title: "",
  stage: "new",
  status: "open",
  value: "",
  currency: "ZMW",
  listingId: "",
  clientId: "",
};

type DealEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditDealPage({ params }: DealEditPageProps) {
  const { id } = await params;
  const prisma = getPrismaClient();
  const [deal, listings, clients] = await Promise.all([
    getContourDeal(prisma, id),
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

  if (!deal) {
    notFound();
  }

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1100px] space-y-4">
        <Link
          href={`/deals/${deal.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to deal
        </Link>

        <DealForm
          submitLabel="Save deal"
          initialValues={{
            title: deal.title,
            stage: deal.stage,
            status: deal.status,
            value: String(deal.valueCents / 100),
            currency: deal.currency,
            listingId: deal.listingId ?? fallbackValues.listingId,
            clientId: deal.clientId ?? fallbackValues.clientId,
          }}
          dealId={deal.id}
          cancelHref={`/deals/${deal.id}`}
          heading="Edit deal"
          description="Update the pipeline stage, outcome, value, or linked records without losing the current deal record."
          listings={listings.map((listing) => ({ id: listing.id, label: listing.title }))}
          clients={clients.map((client) => ({ id: client.id, label: client.fullName }))}
        />
      </div>
    </WorkspaceShell>
  );
}
