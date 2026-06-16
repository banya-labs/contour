"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function DriveUploadPage() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string>("");
  const [uploadedName, setUploadedName] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setStatus("uploading");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", "default");
      formData.append("createdById", "default");

      const response = await fetch("/api/drive/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      setUploadedName(file.name);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.02em]">Upload File</h1>
          <p className="mt-1 text-[13px] text-[color:var(--muted)]">
            Upload files to your workspace drive
          </p>
        </div>
        <Link
          href="/drive"
          className="inline-flex items-center gap-2 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-2.5 text-[13px] font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface)]"
        >
          ← Back to Drive
        </Link>
      </div>

      {/* Upload Area */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex w-full max-w-lg cursor-pointer flex-col items-center gap-4 rounded-[28px] border-2 border-dashed p-12 transition-colors ${
            dragOver
              ? "border-[color:var(--primary)] bg-[color:rgba(39,26,0,0.04)]"
              : "border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--primary)] hover:bg-[color:rgba(39,26,0,0.02)]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />

          {status === "idle" && (
            <>
              <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                <Upload className="size-8 text-[color:var(--muted)]" />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-medium text-[color:var(--foreground)]">
                  Drop a file here or click to browse
                </p>
                <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                  Supports images, PDFs, documents, spreadsheets, and more
                </p>
              </div>
            </>
          )}

          {status === "uploading" && (
            <>
              <Loader2 className="size-10 animate-spin text-[color:var(--primary)]" />
              <div className="text-center">
                <p className="text-[15px] font-medium text-[color:var(--foreground)]">
                  Uploading...
                </p>
                <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                  Please wait while your file is being uploaded
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="size-10 text-green-500" />
              <div className="text-center">
                <p className="text-[15px] font-medium text-[color:var(--foreground)]">
                  Upload successful!
                </p>
                <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                  {uploadedName}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStatus("idle");
                  setUploadedName("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-[12px] bg-[color:var(--primary)] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Upload Another
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="size-10 text-red-500" />
              <div className="text-center">
                <p className="text-[15px] font-medium text-[color:var(--foreground)]">
                  Upload failed
                </p>
                <p className="mt-1 text-[12px] text-red-500">{error}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStatus("idle");
                  setError("");
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-2 text-[13px] font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface)]"
              >
                Try Again
              </button>
            </>
          )}
        </div>

        {status === "idle" && (
          <p className="mt-6 text-[12px] text-[color:var(--muted)]">
            Files are stored in Vercel Blob and visible in your Drive folder.
          </p>
        )}
      </div>
    </div>
  );
}
