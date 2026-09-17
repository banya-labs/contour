"use client";

import React, { useState, useRef } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === "dark";

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (disabled || files.length === 0) return;
    setError(null);
    setUploading(true);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not a valid image file.`);
        setUploading(false);
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError(`"${file.name}" exceeds the 15MB file size limit.`);
        setUploading(false);
        return;
      }
      validFiles.push(file);
    }

    if (photos.length + validFiles.length > maxPhotos) {
      setError(`You can only upload up to ${maxPhotos} photos per listing.`);
      setUploading(false);
      return;
    }

    const uploadedUrls: string[] = [];

    try {
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);
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
            : data.error || `Failed to upload "${file.name}"`;
          throw new Error(errMsg);
        }

        uploadedUrls.push(data.url);
      }

      const updatedPhotos = [...photos, ...uploadedUrls];
      const updatedFeatured = featuredPhoto || updatedPhotos[0];
      onChange(updatedPhotos, updatedFeatured);
    } catch (err: any) {
      console.error("Image upload error:", err);
      setError(err.message || "An error occurred while uploading photos.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleRemove = (indexToRemove: number) => {
    if (disabled) return;
    const photoToRemove = photos[indexToRemove];
    const updated = photos.filter((_, idx) => idx !== indexToRemove);
    let newFeatured = featuredPhoto;
    if (featuredPhoto === photoToRemove || !updated.includes(featuredPhoto || "")) {
      newFeatured = updated[0];
    }
    onChange(updated, newFeatured);
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

  return (
    <div className="space-y-3 font-sans">
      {/* Hidden Native File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
        disabled={disabled || uploading}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
        disabled={disabled || uploading}
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
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
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
                ? "Uploading listing photos..."
                : "Drop photos here or click to open file dialog"}
            </p>
            <p className={`text-[10px] mt-0.5 ${isDark ? "text-slate-400" : "text-stone-500"}`}>
              Supports high-res JPEG, PNG, WebP up to 15MB each (Max {maxPhotos} photos)
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
              disabled={disabled || uploading}
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
              disabled={disabled || uploading}
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
          <span>{error}</span>
        </div>
      )}

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className={`font-bold ${isDark ? "text-slate-300" : "text-stone-700"}`}>
              Listing Photos ({photos.length}/{maxPhotos})
            </span>
            <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-stone-500"}`}>
              Click ★ to select cover photo
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((url, idx) => {
              const isCover = (featuredPhoto || photos[0]) === url;

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
                  <Image
                    src={url}
                    alt={`Listing photo ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 33vw, 25vw"
                    className="object-cover"
                  />

                  {/* Cover Badge */}
                  {isCover && (
                    <div className="absolute top-1 left-1 bg-[#E57A1A] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
                      COVER
                    </div>
                  )}

                  {/* Action Overlay */}
                  {!disabled && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
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
          </div>
        </div>
      )}
    </div>
  );
}
