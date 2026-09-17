"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Share2,
  PlusSquare,
  Download,
  X,
  Smartphone,
  Monitor,
  Laptop,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallBanner() {
  const [isStandalone, setIsStandalone] = useState(true); // Default true to avoid hydration flash
  const [isDismissed, setIsDismissed] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(standaloneMode);

    // 2. Check if user previously dismissed prompt
    const dismissed = localStorage.getItem("contour_pwa_banner_dismissed") === "true";
    setIsDismissed(dismissed);

    // 3. Detect Platform
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isMacDevice = /Macintosh|Mac OS X/.test(ua) && !isIosDevice;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    setIsIos(isIosDevice);
    setIsMac(isMacDevice);
    setIsMobile(isMobileDevice);

    // 4. Capture native beforeinstallprompt on Chromium / Edge / Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsStandalone(true);
      setIsModalOpen(false);
    };

    // 5. Global custom event to open the install modal from buttons/headers
    const handleOpenModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("open-pwa-install-modal", handleOpenModal);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("open-pwa-install-modal", handleOpenModal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true);
          setIsStandalone(true);
          setIsModalOpen(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("PWA install prompt failed:", err);
      }
    } else {
      // If native prompt is not available, open the guided modal
      setIsModalOpen(true);
    }
  };

  const handleDismissBanner = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDismissed(true);
    try {
      localStorage.setItem("contour_pwa_banner_dismissed", "true");
    } catch {}
  };

  // If already standalone PWA and modal is closed, render nothing
  if (isStandalone && !isModalOpen) {
    return null;
  }

  return (
    <>
      {/* ── 1. Floating Desktop & Mobile Pop-up Prompt ── */}
      {!isStandalone && !isDismissed && !isModalOpen && (
        <aside
          aria-label="Install Contour App"
          className="fixed bottom-4 right-4 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] bg-[#1C1C1A] text-white border border-neutral-700 shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300 rounded-none font-geist"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0">
              {/* App Icon preview */}
              <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden border border-neutral-700 bg-black">
                <Image
                  src="/icon-512.png"
                  alt="Contour App"
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                    {isMobile ? "Install Contour Mobile" : "Install Contour Desktop"}
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase bg-[#FA3600]/20 text-[#FA3600] px-1.5 py-0.5 border border-[#FA3600]/30">
                    Web App
                  </span>
                </div>

                <p className="text-[12px] text-neutral-300 mt-1 leading-snug">
                  {isMobile
                    ? "Install for full-screen cadastral maps, offline field sync, and WhatsApp flyers."
                    : "Install on your laptop for zero-latency launch, full-screen spatial mapping, and offline resilience."}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="px-3.5 py-1.5 bg-[#FA3600] hover:bg-[#d92f00] text-white text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isMobile ? "Install App" : "Install to Desktop"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="px-2.5 py-1.5 text-xs font-heading text-neutral-400 hover:text-white transition-colors"
                  >
                    How it works
                  </button>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleDismissBanner}
              aria-label="Dismiss installation prompt"
              className="p-1 text-neutral-400 hover:text-white shrink-0 -mr-1 -mt-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* ── 2. Full Install Pop-up Window / Modal ── */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-9998 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg bg-[#1C1C1A] text-white border border-neutral-700 shadow-2xl p-6 sm:p-8 overflow-hidden font-geist">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
              className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with App Identity */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-neutral-700 bg-black shadow-lg">
                <Image
                  src="/icon-512.png"
                  alt="Contour OS"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5 font-heading font-black text-2xl uppercase tracking-tight">
                  <span>C</span>
                  <span className="inline-block w-4 h-4 rounded-full bg-[#FA3600]" />
                  <span>NTOUR</span>
                </div>
                <p id="pwa-install-title" className="text-xs font-mono text-[#FA3600] font-semibold uppercase tracking-wider mt-0.5">
                  Real Estate Operations &bull; Desktop &bull; Mobile
                </p>
              </div>
            </div>

            {/* Why Install Highlights */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-none">
                <div className="flex items-center gap-2 text-xs font-heading font-bold text-neutral-200">
                  <Laptop className="w-3.5 h-3.5 text-[#FA3600]" />
                  <span>Desktop & Dock Launch</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  Launch instantly from your laptop Dock or Taskbar as a dedicated native window.
                </p>
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-none">
                <div className="flex items-center gap-2 text-xs font-heading font-bold text-neutral-200">
                  <Zap className="w-3.5 h-3.5 text-[#FA3600]" />
                  <span>Zero-Latency Offline</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  Continue inspecting Lusaka parcels and mandates even during load-shedding.
                </p>
              </div>
            </div>

            {/* Platform Installation Guide */}
            <div className="mt-6 border-t border-neutral-800 pt-5">
              {/* Chromium 1-Click Option */}
              {deferredPrompt ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-neutral-300">
                    Your browser supports 1-click installation to your desktop or device:
                  </p>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-3 bg-[#FA3600] hover:bg-[#d92f00] text-white font-heading font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Contour to Desktop / Device</span>
                  </button>
                </div>
              ) : (
                /* Platform specific instructions */
                <div className="space-y-3">
                  <div className="text-xs font-heading font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FA3600]" />
                    <span>How to Install on Your Device:</span>
                  </div>

                  {isMac ? (
                    <div className="p-3 bg-white/5 border border-white/10 text-xs text-neutral-300 space-y-2">
                      <p className="font-semibold text-white">On macOS (Safari):</p>
                      <p className="text-[11px] leading-relaxed text-neutral-300">
                        1. Click <strong>File</strong> in the top menu bar (or the <strong>Share</strong> icon).
                        <br />
                        2. Click <strong>Add to Dock...</strong>
                        <br />
                        3. Click <strong>Add</strong> to launch Contour as a desktop app.
                      </p>
                    </div>
                  ) : isIos ? (
                    <div className="p-3 bg-white/5 border border-white/10 text-xs text-neutral-300 space-y-2">
                      <p className="font-semibold text-white">On iPhone / iPad (Safari):</p>
                      <p className="text-[11px] leading-relaxed text-neutral-300 flex items-center gap-1 flex-wrap">
                        1. Tap <Share2 className="w-3.5 h-3.5 text-[#FA3600] inline" /> <strong>Share</strong> in Safari.
                        <br />
                        2. Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-white inline" /> <strong>Add to Home Screen</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/5 border border-white/10 text-xs text-neutral-300 space-y-2">
                      <p className="font-semibold text-white">On Chrome / Edge / Brave:</p>
                      <p className="text-[11px] leading-relaxed text-neutral-300">
                        Look for the <strong>Install</strong> icon (<Download className="w-3 h-3 text-[#FA3600] inline" />) in your browser&apos;s address bar on the right, or open browser settings (&vellip;) and select <strong>&quot;Install Contour...&quot;</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Dismiss */}
            <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-500">
              <span>Lusaka &bull; Southern Africa</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Utility helper to trigger the PWA Install Modal from any button or link
 */
export function triggerPwaInstallModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-pwa-install-modal"));
  }
}
