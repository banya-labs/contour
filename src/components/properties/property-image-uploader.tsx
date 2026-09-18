"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Camera,
  X,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  ImageOff,
  RefreshCw,
} from "lucide-react";

export type PropertyImageUploaderProps = {
  photos: string[];
  featuredPhoto?: string;
  onChange: (photos: string[], featuredPhoto?: string) => void;
  propertyId?: string; // If updating an existing property in DB
  maxPhotos?: number;
  theme?: "light" | "dark";
  disabled?: boolean;
};

type PendingUpload = {
  id: string;
  name: string;
  blobUrl: string;
  size: number;
  isUploading: boolean;
  error?: string;
};

export default function PropertyImageUploader({
  photos = [],
  featuredPhoto,
  onChange,
  propertyId,
  maxPhotos = 12,
  theme = "light",
  disabled = false,
}: PropertyImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === "dark";

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      pendingUploads.forEach((p) => URL.revokeObjectURL(p.blobUrl));
    };
  }, [pendingUploads]);

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (disabled || files.length === 0) return;
    setError(null);

    const validFiles: File[] = [];
    const skippedNames: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage =
        file.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|avif|heic|heif|jfif|tiff)$/i.test(file.name);

      if (!isImage) {
        skippedNames.push(`"${file.name}" (unsupported format)`);
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        skippedNames.push(`"${file.name}" (exceeds 25MB limit)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (skippedNames.length > 0) {
        setError(`Unable to upload: ${skippedNames.join(", ")}`);
      }
      return;
    }

    if (skippedNames.length > 0) {
      setError(`Some files were skipped: ${skippedNames.join(", ")}`);
    }

    const availableSlots = maxPhotos - (photos.length + pendingUploads.length);
    if (availableSlots <= 0) {
      setError(`You have reached the maximum limit of ${maxPhotos} photos.`);
      return;
    }

    const filesToUpload = validFiles.slice(0, availableSlots);
    if (validFiles.length > availableSlots) {
      setError(`Only ${availableSlots} more photo(s) could be added (max ${maxPhotos}).`);
    }

    // 1. Instantly create local object URLs so user SEES the pictures immediately
    const newPendingItems: PendingUpload[] = filesToUpload.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      blobUrl: URL.createObjectURL(file),
      size: file.size,
      isUploading: true,
    }));

    setPendingUploads((prev) => [...prev, ...newPendingItems]);
    setUploading(true);

    try {
      const formData = new FormData();
      for (const file of filesToUpload) {
        formData.append("files", file);
      }
      if (propertyId) {
        formData.append("propertyId", propertyId);
      }

      const res = await fetch("/api/properties/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errMsg = data.details
          ? `${data.error || "Failed to upload image"}: ${data.details}`
          : data.error || `Failed to upload ${filesToUpload.length} photo(s)`;
        throw new Error(errMsg);
      }

      const newUrls: string[] = Array.isArray(data.urls) && data.urls.length > 0
        ? data.urls
        : data.url
        ? [data.url]
        : [];

      // Clean up object URLs
      newPendingItems.forEach((p) => URL.revokeObjectURL(p.blobUrl));
      setPendingUploads((prev) => prev.filter((p) => !newPendingItems.some((n) => n.id === p.id)));

      const updatedPhotos = [...photos, ...newUrls];
      const updatedFeatured = featuredPhoto || updatedPhotos[0];
      onChange(updatedPhotos, updatedFeatured);
    } catch (err: any) {
      console.error("Image upload error:", err);
      setError(err.message || "An error occurred while uploading photos.");
      // Mark pending items with error
      setPendingUploads((prev) =>
        prev.map((p) =>
          newPendingItems.some((n) => n.id === p.id)
            ? { ...p, isUploading: false, error: err.message || "Upload failed" }
            : p
        )
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleDismissPending = (id: string) => {
    setPendingUploads((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.blobUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleRemove = async (indexToRemove: number) => {
    if (disabled) return;
    const photoToRemove = photos[indexToRemove];
    const updated = photos.filter((_, idx) => idx !== indexToRemove);
    let newFeatured = featuredPhoto;
    if (featuredPhoto === photoToRemove || !updated.includes(featuredPhoto || "")) {
      newFeatured = updated[0];
    }
    onChange(updated, newFeatured);

    // If property exists in DB, also trigger server-side deletion immediately
    if (propertyId && photoToRemove) {
      try {
        await fetch(`/api/properties/${propertyId}/photos?url=${encodeURIComponent(photoToRemove)}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("Direct photo delete warning (will persist on form save):", err);
      }
    }
  };

  const handleSetFeatured = (url: string) => {
    if (disabled) return;
    onChange(photos, url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const totalVisibleCount = photos.length + pendingUploads.length;

  return (
    <div className="space-y-3 font-sans">
      {/* Hidden Native File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.avif"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
        disabled={disabled}
      />

      {/* Upload Dropzone / Action Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all ${
          dragOver
            ? isDark
              ? "border-[#E57A1A] bg-[#E57A1A]/10"
              : "border-editorial-red bg-editorial-paper"
            : isDark
            ? "border-emerald-900/60 bg-[#070F0B] hover:border-emerald-700/80"
            : "border-stone-300 bg-stone-50/60 hover:border-editorial-black/40 hover:bg-stone-50"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center ${
              isDark
                ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                : "bg-white text-editorial-black border border-stone-200 shadow-sm"
            }`}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#E57A1A]" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div>
            <p className={`text-xs font-bold ${isDark ? "text-white" : "text-stone-900"}`}>
              {uploading
                ? "Uploading & processing listing photos..."
                : "Drop photos here or click to open file dialog"}
            </p>
            <p className={`text-[10px] mt-0.5 ${isDark ? "text-slate-400" : "text-stone-500"}`}>
              Supports JPEG, PNG, WebP, AVIF, HEIC/HEIF up to 25MB each (Max {maxPhotos} photos)
            </p>
          </div>

          {/* Device Action Buttons */}
          <div
            className="flex items-center gap-2 mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isDark
                  ? "bg-emerald-900 hover:bg-emerald-800 text-white"
                  : "bg-editorial-black hover:bg-black text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Browse Files</span>
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isDark
                  ? "bg-[#14261C] hover:bg-[#1A3326] text-emerald-300 border border-emerald-700/50"
                  : "bg-white hover:bg-stone-100 text-stone-800 border border-stone-300"
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-[#E57A1A]" />
              <span>Use Camera</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-red-500/10 border border-red-500/30 text-red-500 font-semibold"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-1 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Photo Preview Grid (Shows both active uploaded photos and immediate local previews) */}
      {totalVisibleCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className={`font-bold ${isDark ? "text-slate-300" : "text-stone-700"}`}>
              Listing Photos ({totalVisibleCount}/{maxPhotos})
            </span>
            <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-stone-500"}`}>
              Click ★ to select cover photo
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {/* 1. Confirmed Uploaded Photos */}
            {photos.map((url, idx) => {
              const isCover = (featuredPhoto || photos[0]) === url;
              const hasFailed = failedUrls[url];

              return (
                <div
                  key={`${url}-${idx}`}
                  className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    isCover
                      ? "border-[#E57A1A] ring-2 ring-[#E57A1A]/30"
                      : isDark
                      ? "border-emerald-900/60 bg-emerald-950/40"
                      : "border-stone-200 bg-stone-100"
                  }`}
                >
                  {hasFailed ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-stone-100 dark:bg-stone-800 text-stone-500">
                      <ImageOff className="w-5 h-5 text-stone-400 mb-1" />
                      <span className="text-[9px] font-mono leading-tight">Image Offline</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setFailedUrls((prev) => ({ ...prev, [url]: false }))}
                          className="text-[9px] font-bold text-stone-600 dark:text-stone-300 hover:underline flex items-center gap-0.5"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Retry</span>
                        </button>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handleRemove(idx)}
                            className="text-[9px] font-bold text-red-600 hover:underline flex items-center gap-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={url}
                      alt={`Listing photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => setFailedUrls((prev) => ({ ...prev, [url]: true }))}
                    />
                  )}

                  {/* Cover Badge */}
                  {isCover && (
                    <div className="absolute top-1 left-1 bg-[#E57A1A] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow z-10 pointer-events-none">
                      COVER
                    </div>
                  )}

                  {/* Permanent Top-Right Delete Badge (Accessible on mobile/touch & hover) */}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(idx);
                      }}
                      title="Remove Photo"
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center shadow transition-all active:scale-90 z-20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {/* Desktop Hover Action Overlay */}
                  {!disabled && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1 z-10 pointer-events-none group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleSetFeatured(url)}
                        title="Set as Cover Photo"
                        className={`p-1.5 rounded-lg transition-colors ${
                          isCover
                            ? "bg-[#E57A1A] text-white"
                            : "bg-white/90 text-stone-800 hover:bg-white"
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        title="Remove Photo"
                        className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 2. Immediate Local Preview Cards (optimistic UI while uploading) */}
            {pendingUploads.map((pending) => (
              <div
                key={pending.id}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-[#E57A1A] bg-stone-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pending.blobUrl}
                  alt={pending.name}
                  className="w-full h-full object-cover opacity-60"
                />

                {/* Uploading Status Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-black/40">
                  {pending.isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#E57A1A] mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        Uploading...
                      </span>
                      <span className="text-[9px] text-slate-300 truncate max-w-full px-1">
                        {pending.name}
                      </span>
                    </>
                  ) : pending.error ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                      <span className="text-[9px] font-bold text-red-200 line-clamp-2 px-1">
                        {pending.error}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDismissPending(pending.id)}
                        className="mt-1 px-2 py-0.5 text-[9px] font-bold bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        Dismiss
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
