"use client";

import { useState } from "react";
import { Download, FileText, Image as ImageIcon, X } from "lucide-react";
import type { ContourListingDocumentSummary } from "@contour/db";
import { isImageMimeType, summarizeAttachmentKind } from "../lib/listing-attachments";

type ListingAttachmentsGalleryProps = {
  attachments: ContourListingDocumentSummary[];
};

function formatFileSize(fileSizeBytes: number | null) {
  if (fileSizeBytes == null) {
    return "Size unknown";
  }

  if (fileSizeBytes < 1024) {
    return `${fileSizeBytes} B`;
  }

  if (fileSizeBytes < 1024 * 1024) {
    return `${Math.round(fileSizeBytes / 1024)} KB`;
  }

  return `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ListingAttachmentsGallery({ attachments }: ListingAttachmentsGalleryProps) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLabel, setViewerLabel] = useState<string>("");

  if (!attachments.length) {
    return (
      <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-[13px] text-[color:var(--muted)]">
        No attachments yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {attachments.map((attachment) => {
          const image = isImageMimeType(attachment.mimeType);
          const kind = summarizeAttachmentKind(attachment.mimeType);

          return (
            <article
              key={attachment.id}
              className="overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-muted)]"
            >
              <button
                type="button"
                onClick={() => {
                  if (image) {
                    setViewerUrl(attachment.blobUrl);
                    setViewerLabel(attachment.documentName);
                  }
                }}
                className="block w-full text-left"
              >
                <div className="aspect-[4/3] bg-[color:rgba(39,26,0,0.05)]">
                  {image ? (
                    <img
                      src={attachment.blobUrl}
                      alt={attachment.documentName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[color:var(--muted)]">
                      <FileText className="size-10" />
                    </div>
                  )}
                </div>
              </button>

              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium">{attachment.documentName}</p>
                    <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                      {kind === "image" ? "Image" : "File"}
                      {attachment.mimeType ? ` - ${attachment.mimeType}` : ""}
                    </p>
                  </div>
                  {image ? (
                    <ImageIcon className="size-4 text-[color:var(--muted)]" />
                  ) : (
                    <FileText className="size-4 text-[color:var(--muted)]" />
                  )}
                </div>
                <p className="text-[12px] text-[color:var(--muted)]">{formatFileSize(attachment.fileSizeBytes)}</p>
                <a
                  href={attachment.blobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-[12px] font-medium"
                >
                  <Download className="size-3.5" />
                  Open / download
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {viewerUrl ? (
        <button
          type="button"
          onClick={() => {
            setViewerUrl(null);
            setViewerLabel("");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color:rgba(0,0,0,0.7)] p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={viewerLabel}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-[1200px] overflow-hidden rounded-[28px] border border-[color:rgba(255,255,255,0.15)] bg-[color:var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <button
              type="button"
              onClick={() => {
                setViewerUrl(null);
                setViewerLabel("");
              }}
              className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full bg-[color:rgba(39,26,0,0.08)] text-[color:var(--foreground)]"
            >
              <X className="size-5" />
            </button>
            <div className="bg-[color:var(--surface-muted)] p-4">
              <img src={viewerUrl} alt={viewerLabel} className="max-h-[78vh] w-full rounded-[20px] object-contain" />
            </div>
          </div>
        </button>
      ) : null}
    </>
  );
}
