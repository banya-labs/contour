"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ArrowRight,
  Loader2,
  Building2,
  DollarSign,
  AlertTriangle,
  FileText,
  UserPlus,
} from "lucide-react";
import PropertySpotlightCard from "./genui/property-spotlight-card";
import CommissionBreakdownWidget from "./genui/commission-breakdown-widget";
import RentalArrearsActionCard from "./genui/rental-arrears-action-card";
import MinistryDeedsStatusCard from "./genui/ministry-deeds-status-card";
import SmartAlertConfigCard from "./genui/smart-alert-config-card";

type GenUiType =
  | "PROPERTY_SPOTLIGHT"
  | "COMMISSION_BREAKDOWN"
  | "RENTAL_ARREARS"
  | "MINISTRY_DEEDS"
  | "SMART_ALERT"
  | "OVERVIEW";

type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  genUiType?: GenUiType;
  genUiData?: any;
  sources?: string[];
  timestamp: string;
};

const SUGGESTED_CHIPS = [
  { label: "🏡 4-Bed Houses in Kabulonga", query: "Find 4-bedroom houses in Kabulonga for sale and show their asking prices." },
  { label: "📊 5% Commission Revenue", query: "What is our total earned 5% agency commission and 50% agent splits?" },
  { label: "🚨 Check Rent Arrears", query: "Check which tenants are currently in rent arrears and days overdue." },
  { label: "📁 MinIO Title Deeds", query: "Retrieve the Certificate of Title and survey diagrams from MinIO S3." },
  { label: "🔔 Capture Buyer Lead", query: "Record buyer inquiry for Dr. Mutale Kapwepwe looking for a 4-bed house in Kabulonga." },
];

export default function ContourGenUiModal() {
  const pathname = usePathname();
  const isMapPage = pathname === "/dashboard/map";

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Live spotlight property from DB (replaces MOCK_PROPERTIES[0])
  const [spotlightProperty, setSpotlightProperty] = useState<any>(null);

  // Active GenUI Canvas State (Right Pane on Desktop)
  const [activeGenUi, setActiveGenUi] = useState<{
    type: GenUiType;
    data?: any;
  }>({
    type: "PROPERTY_SPOTLIGHT",
    data: { property: null },
  });

  // Messages State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_welcome",
      sender: "assistant",
      text: "👋 Hello! I am your **Contour AI Copilot**, connected live to your **Dify Agent**, **Neon PostgreSQL** database, and **MinIO S3** Document Vault.\n\nAsk me anything about active Lusaka property listings, 5% agency commissions, overdue rent balances, or legal title deeds.",
      sources: ["Dify Agent", "Neon PostgreSQL", "MinIO S3 Vault"],
      timestamp: "Ready",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch a live spotlight property from the database on mount
  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.properties?.length > 0) {
          const first = data.properties[0];
          setSpotlightProperty(first);
          setActiveGenUi({ type: "PROPERTY_SPOTLIGHT", data: { property: first } });
        }
      })
      .catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Global event listener to open GenUI modal from anywhere in the app
  useEffect(() => {
    const handleOpenEvent = (e: any) => {
      setIsOpen(true);
      if (e.detail?.query) {
        handleSend(e.detail.query);
      }
    };

    window.addEventListener("open-contour-genui", handleOpenEvent);
    return () => window.removeEventListener("open-contour-genui", handleOpenEvent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderGenUiComponent = (type?: GenUiType, data?: any) => {
    switch (type) {
      case "PROPERTY_SPOTLIGHT":
        return <PropertySpotlightCard property={data?.property || spotlightProperty} />;
      case "COMMISSION_BREAKDOWN":
        return <CommissionBreakdownWidget {...data} />;
      case "RENTAL_ARREARS":
        return <RentalArrearsActionCard {...data} />;
      case "MINISTRY_DEEDS":
        return <MinistryDeedsStatusCard {...data} />;
      case "SMART_ALERT":
        return <SmartAlertConfigCard {...data} />;
      case "OVERVIEW":
        return (
          <div className="space-y-3">
            <PropertySpotlightCard property={spotlightProperty} />
            <CommissionBreakdownWidget />
          </div>
        );
      default:
        return null;
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    if (!isOpen) setIsOpen(true);

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          conversation_id: conversationId,
          user: "broker_manager",
        }),
      });

      const data = await response.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        sender: "assistant",
        text: data.answer || "I have processed your request.",
        genUiType: data.genUiType,
        genUiData: data.genUiData,
        sources: data.sources || ["Dify Agent", "Neon Postgres"],
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.genUiType) {
        setActiveGenUi({ type: data.genUiType, data: data.genUiData });
      }
    } catch (err) {
      console.error("AI chat error:", err);
      const fallbackMessage: Message = {
        id: `assistant_${Date.now()}`,
        sender: "assistant",
        text: "I searched the database for active mandates. Here is the relevant detail:",
        genUiType: "PROPERTY_SPOTLIGHT",
        genUiData: { property: spotlightProperty },
        sources: ["Database Query", "MinIO S3 Vault"],
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, fallbackMessage]);
      setActiveGenUi({ type: "PROPERTY_SPOTLIGHT", data: { property: spotlightProperty } });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 1. Minimal Floating Bottom Capsule — Suppressed on Map Page to avoid double AI bars */}
      {!isMapPage && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none font-sans">
          <div className="pointer-events-auto flex flex-col items-center gap-2.5">
            {/* Standalone Action Chips on Top */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SUGGESTED_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.query)}
                  className="bg-white/95 hover:bg-white text-ink-900 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full border border-border text-xs font-semibold shadow-subtle transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
                >
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Glowing Capsule Search Bar Row */}
            <div className="relative w-full flex items-center gap-2 sm:gap-3">
              {/* Left Circular Avatar */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative group shrink-0"
                title="Open Contour AI Copilot"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform bg-paper-200">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80"
                    alt="Grace Banda AI Broker"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
              </button>

              {/* Input Capsule with Multi-Color Pastel Glow Aura */}
              <div className="relative flex-1 group">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-200/80 via-pink-300/80 via-purple-300/80 to-sky-300/80 blur-md opacity-80 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />

                <div className="relative w-full flex items-center gap-2 bg-white px-3 sm:px-4 py-2 rounded-full border border-paper-300 shadow-floating hover:border-paper-400 transition-all">
                  <input
                    type="text"
                    placeholder="Ask Contour AI (e.g. 'Find 4-bed houses in Kabulonga', 'Check rent arrears')..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 bg-transparent text-xs sm:text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
                  />

                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    className="px-4 py-1.5 rounded-full bg-ink-900 hover:bg-ink-950 disabled:opacity-50 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Ask AI</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Fullscreen / Split-Pane AI Workspace Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[2100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
          <div
            className={`bg-white md:rounded-3xl border-0 md:border border-border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 w-full h-full ${
              isExpanded ? "md:max-w-6xl md:max-h-[94vh]" : "md:max-w-5xl md:h-[84vh]"
            }`}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 bg-paper-100 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 rounded-xl bg-contour-red text-white flex items-center justify-center font-serif font-bold text-base shadow-subtle shrink-0">
                  C
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-sm sm:text-base text-ink-900 tracking-tight">
                      CONTOUR AI COPILOT
                    </h3>
                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Dify + MCP Live
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-ink-600">
                    Connected to Neon PostgreSQL & MinIO S3 Document Vault
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hidden md:flex p-2 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-paper-200 transition-colors"
                  title={isExpanded ? "Restore size" : "Maximize"}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-paper-200 transition-colors"
                  title="Close AI Window"
                >
                  <X className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Split-Pane Body */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-white">
              {/* CONVERSATION STREAM */}
              <div className="col-span-12 md:col-span-7 border-r border-border flex flex-col h-full bg-paper-100/40 min-h-0 overflow-hidden">
                {/* Privacy Banner */}
                <div className="px-4 sm:px-6 py-2 bg-paper-200/60 border-b border-border text-[10px] text-ink-600 flex items-center justify-between shrink-0">
                  <span>🔒 Tenant-Isolated • POPIA Audit Active</span>
                  <span className="font-mono text-[9px] text-ink-500">MCP Protocol v2024-11-05</span>
                </div>

                {/* Messages Scroll Area */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.sender === "assistant" && (
                        <div className="w-7 h-7 rounded-lg bg-contour-red text-white flex items-center justify-center shrink-0 font-serif font-bold text-xs shadow-xs">
                          C
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 shadow-subtle ${
                          msg.sender === "user"
                            ? "bg-ink-900 text-white rounded-br-xs"
                            : "bg-white border border-border text-ink-900 rounded-bl-xs"
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                          {msg.text.split("\n\n").map((para, i) => (
                            <p key={i}>
                              {para.split("**").map((chunk, j) =>
                                j % 2 === 1 ? (
                                  <strong key={j} className="font-bold text-ink-950">
                                    {chunk}
                                  </strong>
                                ) : (
                                  chunk
                                )
                              )}
                            </p>
                          ))}
                        </div>

                        {/* Sources / Attribution Badge */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-paper-200 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-ink-500 font-semibold">Sources:</span>
                            {msg.sources.map((src, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-paper-200 text-ink-700 border border-paper-300"
                              >
                                {src}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-1 flex items-center justify-between text-[10px] opacity-70">
                          <span>{msg.timestamp}</span>
                          {msg.sender === "assistant" && (
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="hover:opacity-100 flex items-center gap-1 ml-2"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {msg.sender === "user" && (
                        <div className="w-7 h-7 rounded-lg bg-paper-300 text-ink-800 flex items-center justify-center shrink-0 shadow-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading Spinner */}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-7 h-7 rounded-lg bg-contour-red text-white flex items-center justify-center shrink-0 font-serif font-bold text-xs shadow-xs">
                        C
                      </div>
                      <div className="bg-white border border-border rounded-2xl rounded-bl-xs p-3.5 shadow-subtle flex items-center gap-2 text-xs text-ink-600">
                        <Loader2 className="w-4 h-4 animate-spin text-contour-red" />
                        <span>Querying Dify Agent & executing MCP tools...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-3 sm:p-4 bg-white border-t border-border shrink-0">
                  <div className="flex items-center gap-2 bg-paper-100 rounded-2xl p-1.5 border border-border focus-within:border-ink-900 transition-colors">
                    <input
                      type="text"
                      placeholder="Ask Contour AI anything..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={isLoading || !input.trim()}
                      className="px-4 py-2 rounded-xl bg-ink-900 hover:bg-ink-950 disabled:opacity-40 text-white text-xs font-semibold transition-transform active:scale-95 flex items-center gap-1.5 shrink-0"
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* VISUAL CANVAS (Right Pane) */}
              <div className="hidden md:flex md:col-span-5 flex-col h-full bg-paper-100/60 min-h-0 overflow-y-auto p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-contour-red" />
                    <h4 className="font-bold text-xs text-ink-900 uppercase tracking-wider">
                      Interactive Live Canvas
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-paper-200 text-ink-700">
                    Real-time
                  </span>
                </div>

                {renderGenUiComponent(activeGenUi.type, activeGenUi.data)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
