import "../../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "../../../components/client-form";
import { WorkspaceShell } from "../../../components/workspace-shell";

export const dynamic = "force-dynamic";

const initialValues = {
  fullName: "",
  email: "",
  phone: "",
  status: "lead",
  source: "",
};

export default function NewClientPage() {
  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1100px] space-y-4">
        <Link
          href="/clients"
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>

        <ClientForm
          submitLabel="Create client"
          initialValues={initialValues}
          cancelHref="/clients"
          heading="Create client"
          description="Capture the public contact record first."
        />
      </div>
    </WorkspaceShell>
  );
}
