import "../../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPrismaClient, listContourListingsWithDocuments } from "@contour/db";
import { WorkspaceShell } from "../../../components/workspace-shell";
import { ListingsMapView } from "../../../components/listings-map-view";

export const dynamic = "force-dynamic";

export default async function ListingsMapPage() {
  const prisma = getPrismaClient();
  const listings = await listContourListingsWithDocuments(prisma, 100);

  return (
    <WorkspaceShell>
      <div className="space-y-4">
        <Link
          href="/listings"
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to properties
        </Link>

        <ListingsMapView listings={listings} />
      </div>
    </WorkspaceShell>
  );
}
