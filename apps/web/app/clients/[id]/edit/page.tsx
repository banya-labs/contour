import "../../../../lib/load-contour-env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { findContourClientDuplicateHints, getContourClient, getPrismaClient } from "@contour/db";
import { ClientForm } from "../../../../components/client-form";
import { WorkspaceShell } from "../../../../components/workspace-shell";

export const dynamic = "force-dynamic";

type ClientEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditClientPage({ params }: ClientEditPageProps) {
  const { id } = await params;
  const prisma = getPrismaClient();
  const client = await getContourClient(prisma, id);

  if (!client) {
    notFound();
  }

  const duplicateHints = await findContourClientDuplicateHints(prisma, {
    email: client.email,
    phone: client.phone,
    excludeId: client.id,
  });

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1100px] space-y-4">
        <Link
          href={`/clients/${client.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to client
        </Link>

        <ClientForm
          submitLabel="Save client"
          clientId={client.id}
          initialValues={{
            fullName: client.fullName,
            email: client.email ?? "",
            phone: client.phone ?? "",
            status: client.status,
            source: client.source ?? "",
          }}
          cancelHref={`/clients/${client.id}`}
          heading="Edit client"
          description="Update the CRM profile."
          duplicateHints={duplicateHints}
        />
      </div>
    </WorkspaceShell>
  );
}
