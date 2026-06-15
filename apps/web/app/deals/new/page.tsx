import "../../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DealForm } from "../../../components/deal-form";
import { WorkspaceShell } from "../../../components/workspace-shell";
import { getCachedLookupOptions } from "../../../lib/route-data";

export const dynamic = "force-dynamic";

const initialValues = {
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

export default async function NewDealPage() {
  const { listings, clients } = await getCachedLookupOptions();

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
          description="Start a new client enquiry, capture the property requirements, and optionally attach a listing if one already exists."
          listings={listings}
          clients={clients}
        />
      </div>
    </WorkspaceShell>
  );
}
