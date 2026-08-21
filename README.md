# Contour — Real Estate Operations & Field Agent Operating System

> **"The Real Estate Operating System for Lusaka & Southern Africa."**  
> A high-performance, multi-tenant vertical SaaS venture by **Banya Labs**.

---

## 🏛️ Key Capabilities

- **Interactive Geospatial Lusaka Map**: Leaflet GPS map with color-coded pins (🔴 Sale, 🟡 Rent, 🟢 Sold, 🔵 Rented), popups, and synchronized bottom card carousel.
- **Contour AI Broker Copilot (Dify Connected)**: Grounded natural language property search, 5% revenue explanations, arrears tracking, and smart WhatsApp alerts.
- **True 5% Agency Revenue Calculation**: Explicitly separates gross inventory value from actual earned brokerage commission revenue and 50% agent splits.
- **Daily Action Queue**: Proactive operational tasks (WhatsApp arrears reminders, client dialer nudges, DocuSign statement sign-offs, Ministry folio lookups).
- **5-Stage Deal Pipeline Kanban**: Tracks deals from inquiry through viewing, negotiation, offer, and closing with average velocity metrics.
- **Self-Hosted MinIO S3 Object Storage**: High-performance presigned URL binary storage for property photography, Certificates of Title, NRC ID scans, and cadastral survey plans.
- **Landlord Remittance Engine with DocuSign Seam**: Automated `Gross Rent` − `10% Fee` − `Audited Maintenance` = `Net Remittance` formula with non-negotiable human manager approval.
- **Client CRM with 30-Day Anti-Poaching Lock**: Prevents internal deal poaching by exclusively binding clients to closing agents.
- **Field Agent Mobile PWA (`/kiosk`)**: 1-Click WhatsApp flyer generator with masked landlord PII for Lusaka field agents on the move.
- **Machine & MCP Control Plane (`/api/mcp`)**: JSON-RPC 2.0 endpoint with user-scoped token management and 1-click compromise revocation.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router), TypeScript (Strict Mode)
- **Design System**: Warm Paper (`#fdfbfa`), Ink Charcoal (`#27251e`), Burgundy (`#8b1e1e`), TailwindCSS
- **Database**: PostgreSQL with `pgvector` (Prisma ORM)
- **Object Storage**: **Self-Hosted MinIO (S3-Compatible)**
- **Authentication**: Better Auth (Multi-tenancy & API Key plugins)
- **Payments**: Paystack (ZMW, USD, ZAR)
- **AI Backend**: Dify Agent Runtime
- **Testing**: Playwright End-to-End Test Suite

---

## 🚀 Quick Start

```bash
# Clone & install
pnpm install

# Run dev server
pnpm dev

# Build production bundle
pnpm build
```
