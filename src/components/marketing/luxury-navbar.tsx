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
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-serif font-bold text-lg shadow-sm group-hover:scale-105 transition-all duration-200 ${
            isScrolled ? "bg-[#141715] text-[#FAF8F5]" : "bg-white/15 backdrop-blur-md text-white border border-white/20"
          }`}>
            C
          </div>
          <div className="flex flex-col">
            <span className={`font-serif font-bold text-xl tracking-tight transition-colors leading-none ${
              isScrolled ? "text-[#141715] group-hover:text-[#E57A1A]" : "text-white group-hover:text-[#E57A1A]"
            }`}>
              CONTOUR
            </span>
            <span className={`text-[9px] font-mono uppercase tracking-widest font-semibold mt-0.5 ${
              isScrolled ? "text-stone-500" : "text-stone-300"
            }`}>
              Real Estate OS
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <nav className={`hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide transition-colors ${
          isScrolled ? "text-stone-600" : "text-stone-200"
        }`}>
          <Link
            href="#mandates"
            className={isScrolled ? "hover:text-[#141715] transition-colors py-1" : "hover:text-white transition-colors py-1"}
          >
            Mandates
          </Link>
          <Link
            href="#intent"
            className={isScrolled ? "hover:text-[#141715] transition-colors py-1" : "hover:text-white transition-colors py-1"}
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className={isScrolled ? "hover:text-[#141715] transition-colors py-1" : "hover:text-white transition-colors py-1"}
          >
            Pricing
          </Link>
          <Link
            href="/dashboard/map"
            className={isScrolled ? "hover:text-[#141715] transition-colors py-1" : "hover:text-white transition-colors py-1"}
          >
            Lusaka Map
          </Link>
          <Link
            href="/agent"
            className="hover:text-[#E57A1A] transition-colors py-1 flex items-center gap-1 text-[#E57A1A] font-bold"
          >
            <Sparkles className="w-3 h-3" />
            <span>Field Agent PWA</span>
          </Link>
        </nav>

        {/* Right Action CTAs (Clerk Auth Aware) */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/sign-in"
            className={`text-xs font-semibold transition-colors px-3 py-1.5 flex items-center gap-1.5 rounded-lg ${
              isScrolled ? "text-stone-700 hover:text-black hover:bg-stone-200/50" : "text-stone-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <LogIn className={`w-3.5 h-3.5 ${isScrolled ? "text-stone-500" : "text-stone-300"}`} />
            <span>Sign In</span>
          </Link>
          <Link
            href="/sign-up"
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2 group ${
              isScrolled
                ? "bg-[#141715] hover:bg-stone-800 text-[#FAF8F5]"
                : "bg-[#E57A1A] hover:bg-[#E57A1A]/90 text-white shadow-lg shadow-[#E57A1A]/20"
            }`}
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-2 rounded-lg transition-colors ${
            isScrolled ? "text-stone-700 hover:bg-stone-100" : "text-white hover:bg-white/10"
          }`}
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
              href="/agent"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-[#E57A1A]"
            >
              Field Agent Mobile PWA
            </Link>
            <div className="pt-3 border-t border-stone-200 flex flex-col gap-2.5">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-semibold text-stone-700 border border-stone-300 rounded-full hover:bg-stone-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-bold text-white bg-[#141715] rounded-full hover:bg-stone-800 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
