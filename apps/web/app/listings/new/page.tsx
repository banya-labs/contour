import "../../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ListingForm } from "../../../components/listing-form";
import { WorkspaceShell } from "../../../components/workspace-shell";

export const dynamic = "force-dynamic";

const initialValues = {
  title: "",
  propertyType: "Property",
  status: "available",
  price: "",
  currency: "ZMW",
  ownerName: "",
};

export default function NewListingPage() {
  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1100px] space-y-4">
        <Link
          href="/listings"
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to properties
        </Link>

        <ListingForm
          submitLabel="Create listing"
          initialValues={initialValues}
          cancelHref="/listings"
          heading="Create listing"
          description="Add a property or vacant land record, then open it from the detail page to keep editing."
        />
      </div>
    </WorkspaceShell>
  );
}
