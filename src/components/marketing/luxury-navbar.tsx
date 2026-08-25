"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LogIn, ArrowRight, Menu, X, Sparkles } from "lucide-react";

export function LuxuryNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/80 shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Monogram & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#141715] flex items-center justify-center text-[#FAF8F5] font-serif font-bold text-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
            C
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl tracking-tight text-[#141715] group-hover:text-[#E57A1A] transition-colors leading-none">
              CONTOUR
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-stone-500 font-semibold mt-0.5">
              Real Estate OS
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide text-stone-600">
          <Link
            href="#properties"
            className="hover:text-[#141715] transition-colors duration-150 py-1"
          >
            Properties
          </Link>
          <Link
            href="#intent"
            className="hover:text-[#141715] transition-colors duration-150 py-1"
          >
            How It Works
          </Link>
          <Link
            href="#services"
            className="hover:text-[#141715] transition-colors duration-150 py-1"
          >
            Services & Title
          </Link>
          <Link
            href="#map"
            className="hover:text-[#141715] transition-colors duration-150 py-1"
          >
            Lusaka Map
          </Link>
          <Link
            href="#market-notes"
            className="hover:text-[#141715] transition-colors duration-150 py-1"
          >
            Market Notes
          </Link>
          <Link
            href="/kiosk"
            className="hover:text-[#E57A1A] transition-colors duration-150 py-1 flex items-center gap-1 text-[#E57A1A]"
          >
            <Sparkles className="w-3 h-3" />
            <span>Field Agent PWA</span>
          </Link>
        </nav>

        {/* Right Action CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-stone-700 hover:text-black transition-colors px-3 py-1.5 flex items-center gap-1.5 rounded-lg hover:bg-stone-200/50"
          >
            <LogIn className="w-3.5 h-3.5 text-stone-500" />
            <span>Sign In</span>
          </Link>

          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-full bg-[#141715] hover:bg-stone-800 text-[#FAF8F5] text-xs font-bold transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2 group"
          >
            <span>Launch Demo</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF8F5] border-b border-stone-200 px-6 py-5 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-4 text-sm font-semibold text-stone-700">
            <Link
              href="#properties"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-black"
            >
              Properties Catalog
            </Link>
            <Link
              href="#intent"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-black"
            >
              How It Works
            </Link>
            <Link
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-black"
            >
              Services & Custody
            </Link>
            <Link
              href="#map"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-black"
            >
              Lusaka Map
            </Link>
            <Link
              href="#market-notes"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-black"
            >
              Market Notes
            </Link>
            <Link
              href="/kiosk"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-[#E57A1A]"
            >
              Field Agent Mobile PWA
            </Link>
            <div className="pt-3 border-t border-stone-200 flex flex-col gap-2.5">
              <Link
                href="/login"
                className="w-full text-center py-2 text-xs font-semibold text-stone-700 border border-stone-300 rounded-full"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="w-full text-center py-2 text-xs font-bold text-white bg-[#141715] rounded-full"
              >
                Launch Demo
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
