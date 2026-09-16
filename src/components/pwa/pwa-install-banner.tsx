"use client";

import React, { useState, useEffect } from "react";
import { Share2, PlusSquare, Download, X, Smartphone, Check } from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallBanner() {
  const [isStandalone, setIsStandalone] = useState(true); // Default to true to prevent hydration flash
  const [isDismissed, setIsDismissed] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(standaloneMode);

    // 2. Check if user previously dismissed banner
    const dismissed = localStorage.getItem("contour_pwa_banner_dismissed") === "true";
    setIsDismissed(dismissed);

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 4. Capture native beforeinstallprompt on Android / Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("PWA install prompt failed:", err);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("contour_pwa_banner_dismissed", "true");
  };

  // Do not display if already running inside installed standalone app, or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <div className="bg-white border-b border-editorial-border px-4 py-3 shadow-xs animate-in slide-in-from-top-2 duration-300 text-editorial-black relative z-30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 bg-editorial-black text-white shrink-0 flex items-center justify-center font-heading font-bold text-xs border border-editorial-border mt-0.5">
            <Smartphone className="w-4 h-4 text-contour-red" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-xs text-editorial-black uppercase tracking-wider">
                Install Contour Field OS
              </span>
              <span className="text-[9px] font-mono font-bold uppercase bg-red-50 text-contour-red px-1.5 py-0.5 border border-red-200">
                Offline PWA
              </span>
            </div>

            <p className="text-[11px] text-editorial-muted mt-0.5 leading-snug">
              Add to your home screen for full-screen map navigation, zero-latency field sync, and instant WhatsApp flyer generation.
            </p>

            {/* iOS Safari Guided Steps */}
            {isIos && (
              <div className="mt-2 p-2 bg-neutral-50 border border-editorial-border flex items-center gap-2 text-[11px] text-editorial-black font-mono">
                <span className="shrink-0 flex items-center justify-center w-5 h-5 bg-white border border-editorial-border font-bold text-[10px]">
                  1
                </span>
                <span>
                  Tap <Share2 className="inline w-3.5 h-3.5 text-contour-red mx-0.5" /> <strong>Share</strong>, then tap{" "}
                  <PlusSquare className="inline w-3.5 h-3.5 text-editorial-black mx-0.5" /> <strong>Add to Home Screen</strong>.
                </span>
              </div>
            )}

            {/* Android / Chrome 1-Click Install Button */}
            {!isIos && deferredPrompt && (
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3.5 py-1.5 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-contour-red" />
                  <span>Install App to Home Screen</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss installation banner"
          className="p-1 text-editorial-muted hover:text-editorial-black shrink-0 -mr-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
