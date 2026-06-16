import { FileText, FolderOpen, Image, File, Download, Search, Plus } from "lucide-react";
import Link from "next/link";
import { WorkspaceShell } from "../../components/workspace-shell";
import { DriveFileBrowser } from "../../components/drive-file-browser";
import { DriveSearchBar } from "../../components/drive-search-bar";

export const metadata = {
  title: "Drive - Contour",
  description: "File management and document storage for your workspace",
};

export const dynamic = "force-dynamic";

export default async function DrivePage() {
  return (
    <WorkspaceShell>
      <div className="flex h-full flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.02em]">Drive</h1>
            <p className="mt-1 text-[13px] text-[color:var(--muted)]">
              Manage files, documents, and media for properties, deals, and clients
            </p>
          </div>
          <Link
            href="/drive/upload"
            className="inline-flex items-center gap-2 rounded-[12px] bg-[color:var(--primary)] px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Upload File
          </Link>
        </div>

        {/* Search Bar */}
        <DriveSearchBar />

        {/* File Browser */}
        <DriveFileBrowser />
      </div>
    </WorkspaceShell>
  );
}
