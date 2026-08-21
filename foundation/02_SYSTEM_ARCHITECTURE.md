# 02 — System Architecture Specification: Contour

**Project**: Contour  
**Architecture Standard**: Banya Multi-Surface SaaS Architecture (v4.0)  
**Host Target**: Self-hosted Dokploy Container Cluster (Contabo / Hostinger)  
**Author**: Foundation Architect & Agentic Solutions Engineer (Banya Labs)  

---

## 1. System Topology Overview

```
                          ┌──────────────────────────┐
                          │   Cloudflare DNS / SSL   │
                          └─────────────┬────────────┘
                                        │
                                        ▼
                         ┌────────────────────────────┐
                         │   Dokploy Traefik Proxy    │
                         └──────────────┬─────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 │                      │                      │
                 ▼                      ▼                      ▼
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │ Next.js App      │  │ Dify AI Backend  │  │ Evolution API /  │
        │ Container        │  │ (Agent Runtimes) │  │ WhatsApp Gateway │
        │ (App Router)     │  └────────┬─────────┘  └────────┬─────────┘
        └────────┬─────────┘           │                     │
                 │                     │                     │
                 ├─────────────────────┴─────────────────────┤
                 ▼                                           ▼
      ┌───────────────────────┐                   ┌────────────────────┐
      │ PostgreSQL + pgvector │                   │ Redis + BullMQ     │
      │ (Tenant Data & RLS)   │                   │ (Queues & Caching) │
      └───────────────────────┘                   └────────────────────┘
```

---

## 2. Core Foundations vs. Pluggable Modules Selection

### Core Foundation (Standard on Contour):
1. **Better Auth Multi-Tenant Engine**: Server-enforced `organizationId` scoping, RBAC roles (`SUPER_ADMIN`, `BROKER_MANAGER`, `FIELD_AGENT`, `FINANCE_OFFICER`, `LANDLORD`, `TENANT`), and Bearer API Key plugins for machine MCP access.
2. **PostgreSQL 16 + Prisma ORM + `pgvector`**: Stores relational data alongside 1536-dim embeddings of property descriptions for semantic matching.
3. **MongoDB (GridFS & Document Store)**: Self-hosted chunked block storage for high-resolution property photography, Certificates of Title, NRC ID scans, and cadastral survey plans with POPIA access auditing.
4. **Paystack ZAR/USD/ZMW Engine**: Webhook-verified subscription billing with instant Dev Mode bypass.
5. **Admin Control Plane (`/admin`) & Mission Control (`/admin/mission-control`)**: Central tenant governance, container health sentry, and token consumption tracking.
6. **Interactive MCP Key Studio (`/admin/mcp` + `/api/mcp`)**: User-scoped API keys with 1-click compromise revocation.
7. **POPIA Audit Trail & Pino JSON Logging**: Masked PII and immutable access logs for title deeds and owner contacts.

### Selected Pluggable Modules:
1. **`whatsapp-flow`**: Dual Meta Cloud / Evolution API (Baileys) webhook receiver:
   - Ingests draft listings from field agents (photos + voice notes + GPS pin).
   - Dispatches scheduled rent arrears payment reminders to tenants with 4-day cooldown locks.
2. **`kiosk-scanner` (Adapted as Field Agent PWA)**:
   - High-contrast responsive canvas (`/kiosk` / `/agent`).
   - PowerSync client SDK (local SQLite WASM) for offline map and inventory browsing during network load-shedding.
3. **`metered-billing` (Adapted as Landlord Statement Engine)**:
   - Calculates gross rent collected, auto-deducts 10% agency management commission, subtracts verified maintenance expenses, and generates 1-click PDF Landlord Payout Statements with DocuSign Seam authorization.

---

## 3. Surface Routing Architecture

| Surface Path | Primary Audience | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **`/`** | Public Visitors | Value proposition, interactive ROI calculator, pricing tiers, FAQs. |
| **`/p/[slug]`** | Public Buyers & Renters | Branded property card, photo carousel, GPS map, 1-click WhatsApp agent chat. |
| **`/(auth)/login` & `/signup`** | Brokerages & Agents | Better Auth login with 1-click Fast Dev Login persona switching. |
| **`/(dashboard)/dashboard`** | Brokerage Managers | Inventory catalog, commission ledger, rental yield, arrears, client CRM. |
| **`/(dashboard)/dashboard/billing`**| Brokerage Owners | Paystack subscription portal, plan upgrades, invoice history. |
| **`/(dashboard)/dashboard/settings`**| All Users | Tenant governance, RBAC team invitations, profile settings, POPIA data export. |
| **`/(kiosk)/kiosk` or `/agent`** | Field Agents on Mobile | Leaflet GPS property map, landmark navigator, WhatsApp flyer export, PII-masked specs. |
| **`/admin`** | Super Admin / Banya Ops| Multi-tenant oversight, Dokploy container health, POPIA audit events. |
| **`/admin/mission-control`** | Operations / Digital Labor| Dify agent ingestion queue, reminder delivery rates, token usage metrics. |
| **`/admin/mcp`** | Developers / Integrators | Named API keys hub, live tool runner, compromise revocation button. |
| **`/api/mcp`** | External AI Agents | JSON-RPC 2.0 Model Context Protocol endpoint protected by Bearer tokens. |
| **`/api/webhooks/paystack`** | Paystack Billing Engine | HMAC SHA512 signature verified subscription lifecycle listener. |
| **`/api/webhooks/whatsapp`** | WhatsApp Gateway | Evolution API / Twilio inbound message and listing draft receiver. |

---

## 4. Agentic Workflows & The DocuSign Seam

See complete multi-agent specifications, Mermaid state machines, and cooldown locks in [09_AGENTIC_SOLUTIONS_ARCHITECTURE.md](file:///C:/Users/sewar/repos/Contour/foundation/09_AGENTIC_SOLUTIONS_ARCHITECTURE.md).

1. **WhatsApp Voice & Photo Listing Drafts**: Agent voice note $\rightarrow$ Whisper transcription $\rightarrow$ Dify JSON extraction $\rightarrow$ Draft Property $\rightarrow$ **Manager DocuSign Seam Approval**.
2. **Idempotent Rent Arrears Escalation**: Multi-tier WhatsApp notices with 4-day cooldown locks (`arrears-leaseId-year-month-tierX`).
3. **Audited Landlord Statement Remittances**: Gross Rent − 10% Fee − Audited Maintenance = Net Payout $\rightarrow$ **Finance Officer Click Authorization**.
