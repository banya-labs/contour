"use client";

import { useCallback, useEffect, useState } from "react";
import { Folder, FileText, Image, Download, Trash2, ChevronRight } from "lucide-react";

type DriveFile = {
  id: string;
  name: string;
  fileType: string;
  fileSize: bigint;
  createdAt: string;
  createdByUser: { fullName: string };
  listing?: { id: string; title: string };
  deal?: { id: string; title: string };
  client?: { id: string; fullName: string };
  lease?: { id: string; leaseName: string };
};

type DriveFolder = {
  id: string;
  name: string;
  updatedAt: string;
  createdByUser: { fullName: string };
  _count: { childFolders: number; files: number };
};

export function DriveFileBrowser() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: "Root" },
  ]);

  const loadFolder = useCallback(async (folderId: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (folderId) params.append("folderId", folderId);
      params.append("workspaceId", "default");

      const response = await fetch(`/api/drive/files?${params}`);
      const data = (await response.json()) as { files?: DriveFile[] };
      setFiles(data.files || []);

      const folderParams = new URLSearchParams();
      if (folderId) folderParams.append("parentId", folderId);
      folderParams.append("workspaceId", "default");

      const folderResponse = await fetch(`/api/drive/folders?${folderParams}`);
      const folderData = (await folderResponse.json()) as { folders?: DriveFolder[] };
      setFolders(folderData.folders || []);
    } catch (error) {
      console.error("[v0] Load folder error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRootFolder = useCallback(async () => {
    try {
      const res = await fetch("/api/drive/folders?workspaceId=default");
      const data = (await res.json()) as { folders?: DriveFolder[] };
      const rootFolders = (data.folders || []).filter((folder) => folder.name === "Root");
      if (rootFolders.length > 0) {
        setCurrentFolderId(rootFolders[0].id);
        setBreadcrumbs([{ id: rootFolders[0].id, name: "Root" }]);
      }
    } catch (error) {
      console.error("[v0] Root folder fetch error:", error);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (initialized) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetchRootFolder();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchRootFolder, initialized]);

  useEffect(() => {
    if (currentFolderId === null && !initialized) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadFolder(currentFolderId);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [currentFolderId, initialized, loadFolder]);

  const handleFolderClick = (folder: DriveFolder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs((current) => [...current, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (folderId: string | null, index: number) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs((current) => current.slice(0, index + 1));
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return <Image className="size-4" />;
      case "pdf":
      case "document":
      case "spreadsheet":
      case "presentation":
        return <FileText className="size-4" />;
      default:
        return <FileText className="size-4" />;
    }
  };

  const formatFileSize = (bytes: bigint) => {
    const size = Number(bytes);
    if (size === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return `${Math.round((size / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryBadge = (file: DriveFile) => {
    if (file.listing) return { label: `Property: ${file.listing.title}`, color: "bg-blue-100 text-blue-700" };
    if (file.deal) return { label: `Deal: ${file.deal.title}`, color: "bg-green-100 text-green-700" };
    if (file.client) return { label: `Client: ${file.client.fullName}`, color: "bg-purple-100 text-purple-700" };
    if (file.lease) return { label: `Lease: ${file.lease.leaseName}`, color: "bg-orange-100 text-orange-700" };
    return null;
  };

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
        {breadcrumbs.map((crumb, index) => (
          <div key={`${crumb.id ?? "root"}-${index}`} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBreadcrumbClick(crumb.id, index)}
              className="text-[13px] hover:text-[color:var(--foreground)]"
            >
              {crumb.name}
            </button>
            {index < breadcrumbs.length - 1 && <ChevronRight className="size-3.5" />}
          </div>
        ))}
      </div>

      {folders.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-[color:var(--muted)]">Folders</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleFolderClick(folder)}
                className="flex flex-col items-center gap-2 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 transition-colors hover:bg-[color:var(--surface)]"
              >
                <Folder className="size-6 text-[color:var(--primary)]" />
                <p className="truncate text-[11px] font-medium text-[color:var(--foreground)]">{folder.name}</p>
                <p className="text-[9px] text-[color:var(--muted)]">{folder._count.files} files</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-[color:var(--muted)]">Files</p>
          <div className="space-y-1 overflow-y-auto">
            {files.map((file) => {
              const category = getCategoryBadge(file);
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 transition-colors hover:bg-[color:var(--surface)]"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {getFileIcon(file.fileType)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[color:var(--foreground)]">{file.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {category && (
                          <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${category.color}`}>
                            {category.label}
                          </span>
                        )}
                        <span className="text-[11px] text-[color:var(--muted)]">{formatFileSize(file.fileSize)}</span>
                        <span className="text-[11px] text-[color:var(--muted)]">{formatDate(file.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" className="rounded-full p-2 transition-colors hover:bg-[color:var(--surface)]">
                      <Download className="size-4 text-[color:var(--muted)]" />
                    </button>
                    <button type="button" className="rounded-full p-2 transition-colors hover:bg-[color:var(--surface)]">
                      <Trash2 className="size-4 text-[color:var(--muted)]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && initialized && folders.length === 0 && files.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto size-12 text-[color:var(--muted)]" />
            <p className="mt-2 text-[14px] font-medium text-[color:var(--foreground)]">No files yet</p>
            <p className="text-[12px] text-[color:var(--muted)]">Upload files to organize your workspace documents</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-[13px] text-[color:var(--muted)]">Loading...</p>
        </div>
      )}
    </div>
  );
}
