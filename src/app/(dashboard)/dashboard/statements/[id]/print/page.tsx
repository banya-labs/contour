import { LandlordStatementViewer } from "@/components/statements/landlord-statement-viewer";

export default async function LandlordStatementPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LandlordStatementViewer statementId={id} />;
}
