import "../../../../lib/load-contour-env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getContourDeal, getPrismaClient } from "@contour/db";
import { DealForm } from "../../../../components/deal-form";
import { WorkspaceShell } from "../../../../components/workspace-shell";
import { getCachedLookupOptions } from "../../../../lib/route-data";

export const dynamic = "force-dynamic";

const fallbackValues = {
  title: "",
  stage: "new_enquiry",
  status: "open",
  dealType: "sale",
  value: "",
  currency: "ZMW",
  listingId: "",
  clientId: "",
  requestSummary: "",
  preferredPropertyType: "",
  preferredLocation: "",
  preferredProvince: "",
  preferredCityTown: "",
  preferredBedrooms: "",
  preferredBathrooms: "",
};

type DealEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditDealPage({ params }: DealEditPageProps) {
  const { id } = await params;
  const prisma = getPrismaClient();
  const [deal, options] = await Promise.all([
    getContourDeal(prisma, id),
    getCachedLookupOptions(),
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
            dealType: deal.dealType ?? fallbackValues.dealType,
            value: String(deal.valueCents / 100),
            currency: deal.currency,
            listingId: deal.listingId ?? fallbackValues.listingId,
            clientId: deal.clientId ?? fallbackValues.clientId,
            requestSummary: deal.requestSummary ?? fallbackValues.requestSummary,
            preferredPropertyType: deal.preferredPropertyType ?? fallbackValues.preferredPropertyType,
            preferredLocation: deal.preferredLocation ?? fallbackValues.preferredLocation,
            preferredProvince: deal.preferredProvince ?? fallbackValues.preferredProvince,
            preferredCityTown: deal.preferredCityTown ?? fallbackValues.preferredCityTown,
            preferredBedrooms: deal.preferredBedrooms === null ? fallbackValues.preferredBedrooms : String(deal.preferredBedrooms),
            preferredBathrooms:
              deal.preferredBathrooms === null ? fallbackValues.preferredBathrooms : String(deal.preferredBathrooms),
          }}
          dealId={deal.id}
          cancelHref={`/deals/${deal.id}`}
          heading="Edit deal"
          description="Update the enquiry, requirements, stage, or linked property without losing the client record."
          listings={options.listings}
          clients={options.clients}
        />
      </div>
    </WorkspaceShell>
  );
}
