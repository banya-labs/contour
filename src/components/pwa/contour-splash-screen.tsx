"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shield, ArrowRight } from "lucide-react";

export function ContourSplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [statusText, setStatusText] = useState("Initializing Contour OS...");
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    // Check if splash was already shown in this browser session
    try {
      const alreadyShown = sessionStorage.getItem("contour_splash_dismissed");
      if (alreadyShown === "true") {
        setIsVisible(false);
        return;
      }
    } catch {
      // Ignore sessionStorage errors (e.g. incognito restrictions)
    }

    // Trigger sun rise animation on mount
    const animTimer = setTimeout(() => {
      setHasAnimated(true);
    }, 100);

    // Progress step 2
    const step2Timer = setTimeout(() => {
      setStatusText("Loading cadastral map & mandates...");
      setProgress(70);
    }, 700);

    // Progress step 3
    const step3Timer = setTimeout(() => {
      setStatusText("Welcome to Contour");
      setProgress(100);
    }, 1300);

    // Auto dismiss after 1.9s
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, 1900);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem("contour_splash_dismissed", "true");
    } catch {
      // Ignore
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="contour-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
          className="fixed inset-0 z-9999 flex flex-col justify-between bg-[#1C1C1A] text-white select-none overflow-hidden"
          style={{
            // Deep luxury dawn gradient showing through transparent sky
            background:
              "radial-gradient(ellipse 80% 60% at 75% 45%, rgba(250, 54, 0, 0.18) 0%, rgba(28, 28, 26, 0.98) 60%, #141413 100%)",
          }}
        >
          {/* Top Bar: Subtle status & Skip button */}
          <header className="relative z-30 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FA3600] animate-pulse" />
              <span className="font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Lusaka &bull; Southern Africa
              </span>
            </div>

            <button
              onClick={handleDismiss}
              type="button"
              className="group flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all"
            >
              <span>Skip</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </header>

          {/* Center Stage: The Villa Architecture with Rising Sun */}
          <main className="relative flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
            {/* Architectural Visual Container */}
            <div className="relative w-full max-w-xl aspect-16/10 flex items-center justify-center">
              {/* ── Layer 1: The Rising Zambian Red Sun ── */}
              <motion.div
                initial={{ y: 50, scale: 0.9, opacity: 0.6 }}
                animate={
                  hasAnimated
                    ? { y: -38, scale: 1, opacity: 1 }
                    : { y: 50, scale: 0.9, opacity: 0.6 }
                }
                transition={{
                  duration: 1.4,
                  ease: [0.16, 1, 0.3, 1], // easeOutExpo
                }}
                className="absolute z-10 pointer-events-none"
                style={{
                  right: "16%",
                  top: "24%",
                }}
              >
                {/* Sun Disc with ambient radial bloom */}
                <div className="relative">
                  <div className="absolute -inset-6 rounded-full bg-[#FA3600]/30 blur-xl pointer-events-none" />
                  <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-[#FA3600] shadow-[0_0_50px_rgba(250,54,0,0.5)]" />
                </div>
              </motion.div>

              {/* ── Layer 2: Modernist Luxury Villa (HERO.png) ── */}
              <div className="absolute inset-0 z-20 pointer-events-none flex items-end justify-center">
                <div className="relative w-full h-full">
                  <Image
                    src="/images/HERO.png"
                    alt="Contour luxury villa architecture"
                    fill
                    priority
                    className="object-contain object-bottom drop-shadow-2xl"
                    sizes="(max-width: 768px) 100vw, 640px"
                  />
                  {/* Subtle ground fog gradient blend */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1C1C1A] via-[#1C1C1A]/60 to-transparent" />
                </div>
              </div>
            </div>

            {/* ── Layer 3: Brand Identity & Typography ── */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.7 }}
              className="relative z-30 flex flex-col items-center text-center mt-2"
            >
              {/* Proper Contour Logo */}
              <div className="flex items-center gap-1.5 font-heading font-black text-4xl sm:text-5xl md:text-6xl tracking-tight text-white uppercase leading-none">
                <span>C</span>
                <span className="inline-block w-[0.82em] h-[0.82em] rounded-full bg-[#FA3600] shadow-[0_0_20px_rgba(250,54,0,0.6)]" />
                <span>NTOUR</span>
              </div>

              {/* Clear OS Description */}
              <p className="mt-3 font-heading font-semibold text-xs sm:text-sm tracking-[0.25em] text-neutral-300 uppercase">
                Real Estate Operations OS
              </p>

              <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                <span>Mandates</span>
                <span>&bull;</span>
                <span>Spatial Map</span>
                <span>&bull;</span>
                <span>5% Commission Ledger</span>
              </div>
            </motion.div>
          </main>

          {/* Bottom Telemetry & Loading Progress */}
          <footer className="relative z-30 px-6 pb-8 sm:px-10 sm:pb-10 flex flex-col items-center">
            <div className="w-full max-w-xs flex flex-col items-center gap-2">
              <div className="flex items-center justify-between w-full text-[11px] font-mono text-neutral-400">
                <span className="truncate">{statusText}</span>
                <span className="font-bold text-[#FA3600]">{progress}%</span>
              </div>

              {/* Progress track */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FA3600] to-orange-400 rounded-full"
                  initial={{ width: "20%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
