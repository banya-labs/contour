"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type ListingAttachmentsUploadFormProps = {
  listingId: string;
  returnTo: string;
  enabled: boolean;
};

function formatProgressBytes(uploadedBytes: number, totalBytes: number) {
  if (!totalBytes) {
    return "Uploading...";
  }

  const uploadedMegabytes = uploadedBytes / (1024 * 1024);
  const totalMegabytes = totalBytes / (1024 * 1024);
  return `Uploading ${uploadedMegabytes.toFixed(1)} / ${totalMegabytes.toFixed(1)} MB`;
}

export function ListingAttachmentsUploadForm({ listingId, returnTo, enabled }: ListingAttachmentsUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState<string>("Idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || uploading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);

    if (!files.length) {
      setError("Select one or more files first.");
      return;
    }

    formData.set("listingId", listingId);
    formData.set("returnTo", returnTo);

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    setUploading(true);
    setProgress(0);
    setError(null);
    setStatusLabel(formatProgressBytes(0, totalBytes));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/listings/${listingId}/attachments`);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const nextProgress = Math.min(100, Math.round((event.loaded / event.total) * 100));
      setProgress(nextProgress);
      setStatusLabel(formatProgressBytes(event.loaded, event.total));
    };

    xhr.onload = () => {
      setUploading(false);
      setProgress(100);

      if (xhr.status >= 200 && xhr.status < 300) {
        setStatusLabel("Upload complete");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        router.replace(returnTo);
        router.refresh();
        return;
      }

      const response = xhr.response as { error?: string } | null;
      setError(response?.error || "Upload failed.");
      setStatusLabel("Upload failed");
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("Upload failed.");
      setStatusLabel("Upload failed");
    };

    xhr.send(formData);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="grid gap-2">
        <span className="text-[12px] font-medium text-[color:var(--foreground)]">Upload files</span>
        <input
          ref={fileInputRef}
          type="file"
          name="files"
          multiple
          disabled={!enabled || uploading}
          className="block w-full rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-[14px] file:mr-4 file:rounded-[999px] file:border-0 file:bg-[color:var(--primary)] file:px-4 file:py-2 file:text-[12px] file:font-medium file:text-[color:var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>
      <button
        type="submit"
        disabled={!enabled || uploading}
        className="inline-flex h-11 items-center justify-center rounded-[999px] bg-[color:var(--primary)] px-5 text-[13px] font-medium text-[color:var(--primary-foreground)] transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {uploading ? "Uploading..." : "Upload attachments"}
      </button>

      {uploading ? (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-[color:rgba(39,26,0,0.10)]">
            <div
              className="h-full rounded-full bg-[color:var(--primary)] transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[12px] text-[color:var(--muted)]">{statusLabel}</p>
        </div>
      ) : null}

      {error ? <p className="text-[12px] text-[color:var(--danger)]">{error}</p> : null}
    </form>
  );
}
