"use client";
import { StatementViewer } from "./statement-viewer";
export function LandlordStatementViewer({ statementId }: { statementId: string }) {
  return <StatementViewer documentId={statementId} legacyLandlord />;
}
