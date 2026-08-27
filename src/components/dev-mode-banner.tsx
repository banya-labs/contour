"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  Map,
  Smartphone,
  Key,
  Home,
  Check,
  X,
  UserCheck,
} from "lucide-react";

export default function DevModeBanner() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activePersona, setActivePersona] = useState("SUPER_ADMIN");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
    return null;
  }

  const personas = [
    { id: "SUPER_ADMIN", label: "Super Admin", icon: "👑" },
    { id: "BROKER_MANAGER", label: "Broker Manager", icon: "💼" },
    { id: "FIELD_AGENT", label: "Field Agent", icon: "📱" },
  ];

  const routes = [
    { href: "/", label: "Marketing Landing", icon: Home },
    { href: "/dashboard", label: "Operations Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/map", label: "Lusaka Property Map", icon: Map },
    { href: "/agent", label: "Field Agent PWA", icon: Smartphone },
    { href: "/admin/mcp", label: "Admin MCP Studio", icon: Key },
  ];

  const isPwa = pathname?.startsWith("/agent") || pathname?.startsWith("/kiosk");

  return (
    <div ref={menuRef} className={`fixed ${isPwa ? "bottom-20 right-3 hidden sm:block" : "bottom-3 right-3"} z-[9999] font-sans select-none`}>
      {/* Floating Badge Trigger Overlay */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-contour-red text-white text-xs font-bold shadow-lg hover:shadow-xl hover:bg-contour-red/95 transition-all transform active:scale-95 border border-white/20"
        aria-expanded={isOpen}
        aria-label="Toggle Dev Mode Menu"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Dev Mode</span>
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Overlay Dropdown Card */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-3.5 text-xs text-ink-900 dark:text-white space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-1.5 font-bold text-contour-red uppercase text-[10px] tracking-wider">
              <Sparkles className="w-3 h-3" /> Dev Mode Navigation
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-ink-400 hover:text-ink-900 dark:hover:text-white transition-colors rounded-lg hover:bg-paper-200 dark:hover:bg-ink-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fast Dev Persona Switcher Section */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-ink-500 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Fast Dev Persona
            </div>
            <div className="grid grid-cols-1 gap-1">
              {personas.map((persona) => {
                const isActive = activePersona === persona.id;
                return (
                  <button
                    key={persona.id}
                    onClick={() => setActivePersona(persona.id)}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl font-medium text-left transition-all ${
                      isActive
                        ? "bg-ink-900 text-white font-semibold shadow-sm"
                        : "bg-paper-100 hover:bg-paper-200 text-ink-800 border border-border/50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{persona.icon}</span>
                      <span>{persona.label}</span>
                    </span>
                    {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* App Surfaces Routes Navigation Section */}
          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <div className="text-[10px] font-bold text-ink-500 uppercase tracking-wider flex items-center gap-1">
              <LayoutDashboard className="w-3 h-3" /> App Surfaces
            </div>
            <div className="grid grid-cols-1 gap-1">
              {routes.map((route) => {
                const RouteIcon = route.icon;
                const isActive =
                  pathname === route.href ||
                  (route.href !== "/" && pathname?.startsWith(route.href));
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                      isActive
                        ? "bg-contour-red/10 text-contour-red border border-contour-red/20 font-semibold"
                        : "hover:bg-paper-100 text-ink-700 hover:text-ink-900"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <RouteIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{route.label}</span>
                    </span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-contour-red" />}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
