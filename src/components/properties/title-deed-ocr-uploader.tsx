"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Scale,
  Compass,
  MapPin,
  ShieldCheck,
  Sparkles,
  Info,
  X,
} from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import { SectionPendingState } from "@/components/ui/section-pending-state";

// Dynamically import Leaflet with SSR disabled
const ReadonlyBoundaryPreview = dynamic(
  () => import("./readonly-boundary-preview"),
  {
    ssr: false,
    loading: () => (
      <SectionPendingState label="Loading cadastral preview…" compact />
    ),
  }
);

export interface ExtractedBeacon {
  pointLabel: string;
  rawEasting: string;
  rawNorthing: string;
  lat: number;
  lng: number;
}

export interface TitleDeedOcrResult {
  standBoundary: [number, number][];
  plotSizeSqm: number;
  statedAreaSqm?: number | null;
  beacons: ExtractedBeacon[];
  crs?: {
    kind?: string;
    zone?: number | null;
    hemisphere?: string | null;
    datum?: string;
  };
  diagramNumber?: string | null;
  titleDeedNumber?: string | null;
  confidenceScore?: number;
  extractionEngine?: string;
  document?: {
    id: string;
    originalFileName: string;
    fileSize: number;
  } | null;
}

interface TitleDeedOcrUploaderProps {
  onBoundaryExtracted: (result: TitleDeedOcrResult) => void;
  onReset: () => void;
  initialBoundary?: [number, number][];
  currentPlotSize?: string | number;
}

export default function TitleDeedOcrUploader({
  onBoundaryExtracted,
  onReset,
  initialBoundary,
  currentPlotSize,
}: TitleDeedOcrUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<TitleDeedOcrResult | null>(null);
  const [showBeaconsTable, setShowBeaconsTable] = useState(false);

  const handleFileUpload = async (file: File) => {
    setError(null);
    setLoading(true);
    setLoadingStep("Uploading document to secure legal vault...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setTimeout(() => {
        setLoadingStep("Scanning title deed with OCR & identifying survey beacons...");
      }, 800);

      setTimeout(() => {
        setLoadingStep("Transforming UTM survey coordinates to WGS84 GPS...");
      }, 1800);

      const res = await fetch("/api/properties/extract-stand-boundary", {
        method: "POST",
        body: formData,
      });

      if (res.status === 415) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        const fileBase64 = btoa(binary);
        const fallbackRes = await fetch("/api/properties/extract-stand-boundary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileBase64 }),
        });
        const fallbackData = await fallbackRes.json();
        if (!fallbackRes.ok || !fallbackData.success) throw new Error(fallbackData.error || "Failed to extract survey boundaries from document");
        setExtractedResult(fallbackData);
        onBoundaryExtracted(fallbackData);
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract survey boundaries from document");
      }

      setExtractedResult(data);
      onBoundaryExtracted(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during OCR extraction");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleUseSampleDiagram = async () => {
    setError(null);
    setLoading(true);
    setLoadingStep("Loading official Zambian survey diagram fixture...");

    try {
      const formData = new FormData();
      formData.append("sample", "true");

      const res = await fetch("/api/properties/extract-stand-boundary", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load sample cadastral diagram");
      }

      setExtractedResult(data);
      onBoundaryExtracted(data);
    } catch (err: any) {
      setError(err.message || "Failed to extract sample diagram");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleClear = () => {
    setExtractedResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onReset();
  };

  return (
    <div className="space-y-3 bg-[#FCFBF9] border border-editorial-border p-4 sm:p-5">
      {/* Header with Cadastral Integrity Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-contour-red" />
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-editorial-black">
              Title Deed & Cadastral Survey (OCR Boundary Extraction)
            </h3>
          </div>
          <p className="text-[11px] text-editorial-muted font-geist mt-0.5">
            Manual boundary drawing is disabled to prevent incorrect stand records. Stand boundaries are strictly extracted from uploaded official Title Deeds.
          </p>
        </div>

        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-white border border-editorial-border text-editorial-black font-semibold shrink-0">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Lands Act Cap 184
        </span>
      </div>

      {/* If boundary has already been extracted */}
      {extractedResult ? (
        <div className="space-y-4">
          {/* Success Banner */}
          <div className="flex items-start justify-between p-3 bg-emerald-50 border border-emerald-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide font-heading">
                  Verified Cadastral Stand Boundary Extracted
                </p>
                <p className="text-[11px] text-emerald-800 font-geist">
                  {extractedResult.beacons.length} beacon nodes identified via {extractedResult.extractionEngine || "OCR"}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-mono text-emerald-800 hover:text-contour-red flex items-center gap-1 underline"
            >
              <RefreshCw className="w-3 h-3" /> Re-scan / Clear
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-white border border-editorial-border">
              <span className="text-[9px] text-editorial-muted uppercase block">Survey Diagram No.</span>
              <span className="font-bold text-editorial-black truncate block">
                {extractedResult.diagramNumber || "SD/Pending"}
              </span>
            </div>
            <div className="p-2.5 bg-white border border-editorial-border">
              <span className="text-[9px] text-editorial-muted uppercase block">Title Deed Ref</span>
              <span className="font-bold text-editorial-black truncate block">
                {extractedResult.titleDeedNumber || "Verified"}
              </span>
            </div>
            <div className="p-2.5 bg-white border border-editorial-border">
              <span className="text-[9px] text-editorial-muted uppercase block">Calculated Area</span>
              <span className="font-bold text-contour-red block">
                {extractedResult.plotSizeSqm.toLocaleString()} m²
              </span>
            </div>
            <div className="p-2.5 bg-white border border-editorial-border">
              <span className="text-[9px] text-editorial-muted uppercase block">Coordinate CRS</span>
              <span className="font-bold text-editorial-black truncate block">
                {extractedResult.crs?.kind || "UTM"} Z{extractedResult.crs?.zone || 35}S
              </span>
            </div>
          </div>

          {/* Read-only Boundary Preview Map */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-editorial-muted flex items-center gap-1">
                <Compass className="w-3 h-3 text-contour-red" />
                Read-Only Cadastral Stand Polygon Preview
              </span>
              <button
                type="button"
                onClick={() => setShowBeaconsTable(!showBeaconsTable)}
                className="text-[10px] font-mono text-contour-red hover:underline"
              >
                {showBeaconsTable ? "Hide Beacons Table" : `View Beacons (${extractedResult.beacons.length} Points)`}
              </button>
            </div>

            <ReadonlyBoundaryPreview
              standBoundary={extractedResult.standBoundary}
              beacons={extractedResult.beacons}
            />
          </div>

          {/* Optional Detailed Beacon Coordinates Schedule */}
          {showBeaconsTable && (
            <div className="bg-white border border-editorial-border overflow-x-auto text-[11px] font-mono">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-editorial-border text-[9px] uppercase tracking-wider text-editorial-muted">
                    <th className="p-2">Beacon Node</th>
                    <th className="p-2">Raw Easting (X)</th>
                    <th className="p-2">Raw Northing (Y)</th>
                    <th className="p-2">WGS84 Lat</th>
                    <th className="p-2">WGS84 Lng</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedResult.beacons.map((b, idx) => (
                    <tr key={idx} className="border-b border-editorial-border/60 hover:bg-zinc-50">
                      <td className="p-2 font-bold text-contour-red">Point {b.pointLabel}</td>
                      <td className="p-2 text-editorial-black">{b.rawEasting}</td>
                      <td className="p-2 text-editorial-black">{b.rawNorthing}</td>
                      <td className="p-2 text-editorial-muted">{b.lat}</td>
                      <td className="p-2 text-editorial-muted">{b.lng}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Upload Mode */
        <div className="space-y-3">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-contour-red shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">OCR Notice:</span> {error}
              </div>
            </div>
          )}

          {/* Dropzone Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed p-6 text-center transition-colors ${
              dragActive
                ? "border-contour-red bg-red-50/20"
                : "border-editorial-border bg-white hover:border-editorial-black"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {loading ? (
              <div className="py-4 flex flex-col items-center justify-center space-y-2">
                <ContourSunLoader size="md" label={loadingStep || "Extracting title deed…"} decorative />
                <span className="text-xs font-mono font-bold text-editorial-black uppercase">
                  Processing Title Deed
                </span>
                <span className="text-[11px] font-mono text-editorial-muted">
                  {loadingStep}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-10 h-10 mx-auto bg-[#FAF8F5] border border-editorial-border flex items-center justify-center text-contour-red">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-heading font-semibold text-editorial-black">
                    Drag and drop official Title Deed or Survey Diagram here
                  </p>
                  <p className="text-[10px] text-editorial-muted font-mono mt-0.5">
                    Supports PDF, PNG, JPG scans up to 15MB (e.g. Ministry of Lands survey diagrams)
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-editorial-black text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-contour-red transition-colors"
                  >
                    Select File From Device
                  </button>

                  <button
                    type="button"
                    onClick={handleUseSampleDiagram}
                    className="px-3 py-1.5 bg-[#FAF8F5] border border-editorial-border text-editorial-black text-xs font-mono font-semibold hover:border-contour-red hover:text-contour-red transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-contour-red" />
                    Use Sample Survey Diagram (Kabulonga Stand 4821)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
