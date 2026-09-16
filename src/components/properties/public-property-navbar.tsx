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
} from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";

interface PublicPropertyNavbarProps {
  suburb?: string;
}

export function PublicPropertyNavbar({ suburb }: PublicPropertyNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-editorial-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Left: Brand Identity & Link to Contour Website */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 group"
              title="Go to Contour Website"
            >
              <ContourLogo size="sm" />
              <span className="hidden sm:inline-block text-[9px] font-mono font-bold uppercase tracking-wider text-contour-red bg-red-50 px-1.5 py-0.5 border border-red-200">
                Public Mandate
              </span>
            </Link>

            {suburb && (
              <div className="hidden md:flex items-center gap-1 text-xs font-mono text-editorial-muted pl-2 border-l border-editorial-border">
                <MapPin className="w-3 h-3 text-contour-red shrink-0" />
                <span className="truncate max-w-[140px] text-editorial-black font-semibold">
                  {suburb}
                </span>
              </div>
            )}
          </div>

          {/* Center Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-mono tracking-wide text-editorial-muted">
            <Link
              href="/"
              className="hover:text-editorial-black transition-colors"
            >
              Platform
            </Link>
            <Link
              href="/dashboard/map"
              className="hover:text-editorial-black transition-colors flex items-center gap-1"
            >
              <span>Lusaka Spatial Map</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </Link>
            <Link
              href="/#how-it-works"
              className="hover:text-editorial-black transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              className="hover:text-editorial-black transition-colors"
            >
              Pricing
            </Link>
          </nav>

          {/* Right: Actions & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Primary 'Visit Website' CTA - clearly visible on mobile and desktop */}
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors shadow-xs shrink-0"
              title="Visit Contour Official Website"
            >
              <span>Visit Contour</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            {/* Agency Portal Sign-in (Desktop) */}
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-heading font-semibold text-editorial-muted hover:text-editorial-black uppercase tracking-wider px-2 py-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Agency Login</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-editorial-black hover:text-contour-red hover:bg-neutral-100 transition-colors border border-editorial-border cursor-pointer"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown / Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Card */}
          <div className="absolute top-14 left-0 right-0 bg-white border-b border-editorial-border shadow-xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Brand Card Intro */}
            <div className="p-3 bg-neutral-50 border border-editorial-border space-y-1">
              <div className="flex items-center justify-between">
                <ContourLogo size="sm" />
                <span className="text-[9px] font-mono uppercase bg-editorial-black text-white px-1.5 py-0.5 font-bold">
                  Field OS
                </span>
              </div>
              <p className="text-[11px] text-editorial-muted leading-relaxed pt-1">
                The Real Estate Operations & Field Agent Operating System for Southern Africa.
              </p>
            </div>

            {/* Primary Action Button */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 px-4 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-bold uppercase tracking-widest flex items-center justify-between transition-colors shadow-xs"
            >
              <span>Explore Contour Website</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            {/* Navigation List */}
            <div className="divide-y divide-editorial-border border-y border-editorial-border text-xs font-heading uppercase tracking-wider font-semibold">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-3 text-editorial-black hover:text-contour-red transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <LogIn className="w-4 h-4 text-editorial-muted" />
                  <span>Agency Workspace Sign In</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-editorial-muted" />
              </Link>
            </div>

            {/* Footer Support Info */}
            <div className="pt-1 text-center">
              <span className="text-[10px] font-mono text-editorial-muted">
                Contour Real Estate Platform • Lusaka, Zambia
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
