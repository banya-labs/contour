import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant-context";
import { StatementViewer } from "@/components/statements/statement-viewer";
export default async function StatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getTenantContext(new NextRequest("http://contour.internal/statements", { headers: await headers() }));
  if (!tenant) redirect(`/login?callbackUrl=${encodeURIComponent(`/statements/${id}`)}`);
  return <StatementViewer documentId={id} />;
}
