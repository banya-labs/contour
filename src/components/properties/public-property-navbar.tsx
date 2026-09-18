"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Menu,
  X,
  MapPin,
  Building2,
  ChevronRight,
  LogIn,
  Home,
  Smartphone,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";

interface PublicPropertyNavbarProps {
  suburb?: string;
}

export function PublicPropertyNavbar({ suburb }: PublicPropertyNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-editorial-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Left: Brand Identity & Highlighted Location */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 group"
              title="Go to Contour Website"
            >
              <ContourLogo size="sm" />
            </Link>

            {/* Highlighted Location Badge - Visible on all screen sizes */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 border border-editorial-border text-xs font-mono text-editorial-black shadow-2xs shrink-0 max-w-[160px] sm:max-w-[240px]">
              <MapPin className="w-3.5 h-3.5 text-contour-red shrink-0" />
              <span className="truncate font-semibold">{suburb || "Lusaka, Zambia"}</span>
            </div>
          </div>

          {/* Right: Visit Contour & Uniform Hamburger Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Link to Official Platform */}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors shadow-2xs shrink-0"
              title="Visit Contour Official Website"
            >
              <span>Visit Contour</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            {/* Uniform Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 border border-editorial-border bg-white hover:bg-neutral-50 active:bg-neutral-100 text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4 text-editorial-black" />
              <span className="font-mono text-xs font-bold">Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Solid Slide-over Drawer Panel */}
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-sm sm:max-w-md bg-white border-l border-editorial-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header with Proper Solid X */}
            <div className="px-5 py-4 border-b border-editorial-border flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <ContourLogo size="sm" />
                <span className="text-[9px] font-mono uppercase bg-editorial-black text-white px-1.5 py-0.5 font-bold">
                  Public Portal
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-1.5 text-editorial-black hover:text-contour-red hover:bg-neutral-100 border border-editorial-border bg-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Highlighted Location Card */}
              <div className="p-3 bg-neutral-50 border border-editorial-border space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-contour-red font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Listing Location</span>
                </div>
                <p className="text-sm font-heading font-bold text-editorial-black">
                  {suburb || "Lusaka, Zambia"}
                </p>
                <p className="text-[11px] text-editorial-muted">
                  Lusaka Cadastre Registry • Verified Public Property Mandate
                </p>
              </div>

              {/* Public Client Launch Demo Date Announcement */}
              <div className="p-3 bg-editorial-black text-white space-y-1.5 border border-editorial-black">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-contour-red font-bold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Public Client Launch</span>
                </div>
                <p className="text-xs font-heading font-bold uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-contour-red shrink-0" />
                  <span>Saturday, 26 Sept 2026 • 10:00 CAT</span>
                </p>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Official public rollout of client property dossiers, cadastre boundaries, and WhatsApp search.
                </p>
              </div>

              {/* Primary Action Button */}
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="w-full py-2.5 px-4 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-bold uppercase tracking-widest flex items-center justify-between transition-colors shadow-xs"
              >
                <span>Explore Contour Platform</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>

              {/* Navigation Links List */}
              <div className="divide-y divide-editorial-border border-y border-editorial-border text-xs font-heading uppercase tracking-wider font-semibold">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-editorial-black hover:text-contour-red transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-editorial-muted" />
                    <span>Platform Overview</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-editorial-muted" />
                </Link>

                <Link
                  href="/dashboard/map"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-editorial-black hover:text-contour-red transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-contour-red" />
                    <span>Lusaka Spatial Cadastre Map</span>
                  </div>
                  <span className="text-[10px] font-mono text-contour-red font-bold">Live</span>
                </Link>

                <Link
                  href="/#how-it-works"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-editorial-black hover:text-contour-red transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-editorial-muted" />
                    <span>How Contour Works</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-editorial-muted" />
                </Link>

                <Link
                  href="/#pricing"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-editorial-black hover:text-contour-red transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-editorial-muted" />
                    <span>Agency Pricing & Tiers</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-editorial-muted" />
                </Link>

                <Link
                  href="/kiosk"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-editorial-black hover:text-contour-red transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Field Agent Mobile PWA</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-editorial-muted" />
                </Link>

                <Link
                  href="/sign-in"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-editorial-black hover:text-contour-red transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <LogIn className="w-4 h-4 text-editorial-muted" />
                    <span>Agency Workspace Sign In</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-editorial-muted" />
                </Link>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-editorial-border bg-neutral-50 text-center">
              <p className="text-[10px] font-mono text-editorial-muted">
                Contour Real Estate Platform • Lusaka, Zambia
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
