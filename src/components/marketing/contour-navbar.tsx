"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Download } from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";
import { triggerPwaInstallModal } from "@/components/pwa/pwa-install-banner";

export function ContourNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 60) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      if (currentScrollY > 200 && currentScrollY > lastScrollY) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { label: "Product", href: "#product" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-editorial-border shadow-none"
          : "bg-white border-b border-editorial-border"
      }`}
    >
      <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-10 lg:px-16 h-[72px] flex items-center justify-between border-x border-editorial-border/40">
        {/* Left: Brand Wordmark */}
        <Link
          href="/"
          className="group"
        >
          <ContourLogo size="lg" />
        </Link>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-geist text-sm tracking-wide text-editorial-muted hover:text-editorial-black hover-un py-1 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Desktop CTA & Mobile Hamburger */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Desktop-Only Action Buttons */}
          <div className="hidden md:flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={triggerPwaInstallModal}
              className="inline-flex items-center gap-1.5 font-geist text-xs font-semibold uppercase tracking-wider text-contour-red hover:text-editorial-black border border-red-200 bg-red-50/70 hover:bg-red-50 px-2.5 py-1.5 transition-colors"
              title="Download Contour App"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Install App</span>
            </button>
            <Link
              href="/sign-in"
              className="font-geist text-xs uppercase tracking-wider text-editorial-muted hover:text-editorial-black hover-un px-2 py-1"
            >
              Log In
            </Link>
            <Link
              href="/sign-up"
              className="btn-fill-wipe bg-editorial-black text-white px-5 sm:px-6 py-2.5 sm:py-3 font-heading text-xs sm:text-sm font-semibold tracking-wide border-none rounded-none"
            >
              <span>Get Started</span>
            </Link>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-editorial-black hover:text-editorial-red focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-editorial-border px-6 py-6 flex flex-col gap-4 shadow-xl"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-heading text-lg font-semibold text-editorial-black hover:text-editorial-red transition-colors py-2 border-b border-editorial-border/40"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  triggerPwaInstallModal();
                }}
                className="w-full font-geist text-xs font-semibold uppercase tracking-wider text-contour-red hover:text-editorial-black border border-red-200 bg-red-50/70 hover:bg-red-50 py-3 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Install Contour App</span>
              </button>
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full font-geist text-sm text-center py-2.5 text-editorial-muted hover:text-editorial-black border border-editorial-border font-medium transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-editorial-black text-white text-center py-3 font-heading text-sm font-semibold tracking-wide hover:bg-editorial-red transition-colors"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
