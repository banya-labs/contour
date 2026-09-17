"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share2, PlusSquare, Monitor, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // Capture native install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleOpen = () => setIsOpen(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("open-pwa-install-modal", handleOpen);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("open-pwa-install-modal", handleOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsOpen(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative w-full max-w-md bg-white border border-editorial-border shadow-2xl p-6 font-geist text-editorial-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-editorial-muted hover:text-editorial-black hover:bg-neutral-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-editorial-border">
          <div className="w-10 h-10 bg-[#FA3600] text-white flex items-center justify-center font-heading font-black text-lg">
            C
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-editorial-black">
              Install Contour App
            </h3>
            <p className="text-xs text-editorial-muted">
              Add Contour to your home screen or desktop
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="py-5 space-y-4">
          {deferredPrompt ? (
            <div className="space-y-3 text-center">
              <p className="text-xs text-editorial-muted">
                Your browser supports direct installation:
              </p>
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-2.5 bg-[#FA3600] hover:bg-[#d92f00] text-white text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Install Now</span>
              </button>
            </div>
          ) : isIos ? (
            <div className="space-y-2.5">
              <p className="text-xs font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#FA3600]" />
                <span>iPhone / iPad (Safari)</span>
              </p>
              <ol className="text-xs text-editorial-black/80 space-y-2 bg-neutral-50 p-3.5 border border-editorial-border leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-editorial-black">1.</span>
                  <span>
                    Tap the <strong>Share</strong> button{" "}
                    <Share2 className="w-3.5 h-3.5 inline text-[#FA3600]" /> at the bottom of Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-editorial-black">2.</span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>{" "}
                    <PlusSquare className="w-3.5 h-3.5 inline text-editorial-black" />.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-editorial-black">3.</span>
                  <span>Tap <strong>Add</strong> in the top right corner.</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-[#FA3600]" />
                <span>Chrome / Edge / Desktop</span>
              </p>
              <ol className="text-xs text-editorial-black/80 space-y-2 bg-neutral-50 p-3.5 border border-editorial-border leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-editorial-black">1.</span>
                  <span>
                    Click the <strong>Install</strong> icon{" "}
                    <Download className="w-3.5 h-3.5 inline text-[#FA3600]" /> on the right side of the address bar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-editorial-black">2.</span>
                  <span>
                    Or click the browser menu (<strong>⋮</strong>) and choose <strong>&ldquo;Install Contour&rdquo;</strong>.
                  </span>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer with simple close button */}
        <div className="pt-3 border-t border-editorial-border flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border border-editorial-border text-xs font-heading font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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

