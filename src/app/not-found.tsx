import Link from "next/link";
import { ContourLogo } from "@/components/brand/contour-logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-editorial-black font-geist select-none">
      <div className="max-w-md w-full text-center space-y-4">
        <ContourLogo size="lg" />
        <h1 className="text-4xl font-heading font-black tracking-tight text-editorial-black mt-4">
          404 — PAGE NOT FOUND
        </h1>
        <p className="text-sm text-editorial-muted">
          The requested real estate parcel or workspace record could not be found.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#1C1C1A] hover:bg-[#FA3600] text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Return to Contour OS
          </Link>
        </div>
      </div>
    </div>
  );
}
