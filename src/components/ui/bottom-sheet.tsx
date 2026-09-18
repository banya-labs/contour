"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
  containerClassName?: string;
  zIndex?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = "max-h-[85dvh]",
  className = "",
  containerClassName = "",
  zIndex = "z-[2500]",
}: BottomSheetProps) {
  // Prevent background body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 ${zIndex} flex flex-col justify-end pointer-events-auto ${containerClassName}`}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={`relative z-10 w-full sm:max-w-xl sm:mx-auto bg-white border-t sm:border-x border-editorial-border shadow-2xl flex flex-col sm:rounded-t-2xl ${maxHeight} pb-safe ${className}`}
          >
            {/* Grab Handle */}
            <div className="w-full flex items-center justify-center pt-2.5 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-neutral-300" />
            </div>

            {/* Header if title exists */}
            {(title || subtitle) && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-editorial-border shrink-0">
                <div className="min-w-0 pr-3">
                  {title && (
                    <h3 className="font-heading text-sm font-bold text-editorial-black uppercase tracking-wider truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="font-geist text-xs text-editorial-muted truncate mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-none border border-editorial-border bg-white text-editorial-black hover:bg-editorial-black hover:text-white transition-all shadow-xs shrink-0"
                  aria-label="Close sheet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
