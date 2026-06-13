import "../../../../lib/load-contour-env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getContourListing, getPrismaClient } from "@contour/db";
import { ListingForm } from "../../../../components/listing-form";
import { WorkspaceShell } from "../../../../components/workspace-shell";

export const dynamic = "force-dynamic";

type ListingEditPageProps = {
  params: {
    id: string;
  };
};

export default async function EditListingPage({ params }: ListingEditPageProps) {
  const prisma = getPrismaClient();
  const listing = await getContourListing(prisma, params.id);

  if (!listing) {
    notFound();
  }

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1100px] space-y-4">
        <Link
          href={`/listings/${listing.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to listing
        </Link>

        <ListingForm
          listingId={listing.id}
          submitLabel="Save changes"
          initialValues={{
            title: listing.title,
            propertyType: listing.propertyType,
            status: listing.status,
            price: String(listing.priceCents / 100),
            currency: listing.currency,
            ownerName: listing.ownerName ?? "",
          }}
          cancelHref={`/listings/${listing.id}`}
          heading="Edit listing"
          description="Update the live property record and return you to the listing detail page."
        />
      </div>
    </WorkspaceShell>
  );
}
