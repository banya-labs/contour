import { ListingAttachmentsGallery } from "./listing-attachments-gallery";
import type { ContourListingDocumentSummary } from "@contour/db";
import { ListingAttachmentsUploadForm } from "./listing-attachments-upload-form";

type ListingAttachmentsPanelProps = {
  listingId: string;
  returnTo: string;
  attachments: ContourListingDocumentSummary[];
};

export function ListingAttachmentsPanel({ listingId, returnTo, attachments }: ListingAttachmentsPanelProps) {
  const blobTokenConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());

  return (
    <section className="space-y-4 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Attachments</p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Images, documents, and anything else</h2>
          <p className="mt-2 text-[14px] leading-7 text-[color:var(--muted)]">
            Upload anything you want to keep with this property. Images show thumbnails and open in-app; other files
            open or download in the browser.
          </p>
          {!blobTokenConfigured ? (
            <p className="mt-2 rounded-[16px] border border-[color:rgba(167,93,7,0.18)] bg-[color:rgba(167,93,7,0.08)] px-3 py-2 text-[12px] leading-6 text-[color:var(--warning)]">
              Blob uploads are not configured in this environment yet. Add `BLOB_READ_WRITE_TOKEN` to enable file
              uploads.
            </p>
          ) : null}
        </div>
      </div>

      <ListingAttachmentsUploadForm listingId={listingId} returnTo={returnTo} enabled={blobTokenConfigured} />

      <ListingAttachmentsGallery attachments={attachments} />
    </section>
  );
}
