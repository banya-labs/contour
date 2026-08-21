# 01 — Product Requirements Document (PRD): Contour

**Project Name**: Contour  
**Vertical**: Real Estate Operations & Field Agent Operating System  
**Region Target**: Southern Africa (Zambia — Lusaka/Copperbelt/Livingstone; Zimbabwe; South Africa)  
**Status**: Foundation Specification (Ready for Autonomous Build)  
**Author**: Foundation Architect (Banya Labs)  

---

## 1. Executive Summary & Market Thesis

Independent real estate brokerages, commercial leasing agencies, and property management firms across Southern Africa operate in a severely fragmented state. They manage listings across fragmented WhatsApp group chats, Excel ledgers, and Facebook Marketplace posts. 

Current international real estate CRMs (HubSpot, Salesforce, Propertybase) fail in this market due to 4 fatal design mismatches:
1. **Misleading Revenue Accounting**: Treating the gross property sale value (e.g., K2,500,000 / $100,000) as company revenue instead of tracking net earned agency commission (e.g., 5% = K125,000 / $5,000).
2. **Ignored Dual-Currency Reality**: Prime commercial and residential leases in Lusaka (Kabulonga, Leopards Hill, Roma Park) are negotiated in **USD**, while standard middle-market rentals operate in **ZMW (Zambian Kwacha)**.
3. **Formal Address Assumption**: Lusaka properties often lack standardized street numbers, relying on GPS coordinates, plot numbers, and landmark directions (*"150m past American Embassy off Ibex Hill Road"*).
4. **Desktop Bias vs. Mobile/WhatsApp Field Reality**: Agents spend 80% of their time on the road or in viewings. Complicated multi-field desktop portals lead to immediate data entry strikes and obsolete "ghost listings."

**Contour** solves this by providing a multi-surface operating system that gives management complete visibility over cash flow, landlord remittances, and rental arrears, while giving field agents high-speed mobile tools to share branded listing flyers, verify GPS landmarks, and log client leads without leaving their mobile workflow.

---

## 2. Target Personas & Ideal Customer Profile (ICP)

### Primary ICP:
- Mid-sized real estate brokerages (5 to 40 agents) in Lusaka, Harare, and Johannesburg.
- Independent property management firms managing 20 to 500 residential/commercial rental units.
- Real estate developers marketing new multi-plot residential subdivisions.

### Key Personas:
1. **The Broker / Managing Director (Grace)**:
   - *Goal*: Real-time visibility into true company cashflow, agent deal pipeline, and rental arrears.
   - *Pain Point*: Cannot tell what earned commission is pending vs. received; landlords constantly demand manual payout reconciliation statements.
2. **The Field Real Estate Agent (Tembo)**:
   - *Goal*: Quickly find available properties matching client budgets, get landmark directions, and send clean WhatsApp listing cards in 2 taps.
   - *Pain Point*: Carries 40 PDF flyers on his phone; loses track of client inquiries; gets into commission attribution disputes with colleagues.
3. **The Property Owner / Landlord (Banda)**:
   - *Goal*: Predictable, transparent monthly rental income statements with automated deduction logs for maintenance and agency fees.
   - *Pain Point*: Unclear when tenants pay; delays in receiving net rent remittances.
4. **The Tenant (Mwila)**:
   - *Goal*: Clear digital rent receipts, simple payment methods, and transparent lease status.

---

## 3. Multi-Surface Functional Scope

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CONTOUR MULTI-SURFACE MAP                       │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Public Surface       → Landing Page, Pricing, Public Property Card  │
│ 2. Operations Dashboard → Inventory Engine, Commission Ledger, Arrears │
│ 3. Field Agent PWA      → GPS Map, WhatsApp Flyers, Lead Logger        │
│ 4. Admin Mission Control→ Multi-Tenant Control, Dify Sentry, MCP Hub   │
│ 5. Machine & MCP        → /api/mcp JSON-RPC Tool Grid, llms.txt        │
└────────────────────────────────────────────────────────────────────────┘
```

### Surface 1: Public Marketing & Shared Property Cards (`/` & `/p/[slug]`)
- **Landing Page**: Explains the Contour operating system, ROI calculator, and Paystack ZAR/USD/ZMW billing.
- **Fast Dev Login & Auth**: Better Auth session creation and 1-click persona switcher (`DEV_MODE`).
- **Shareable Public Listing Card (`/p/[slug]`)**:
  - High-res photo gallery with CDN optimization.
  - Key attributes: Bedrooms, bathrooms, plot size, ownership type, price in ZMW/USD.
  - Interactive Leaflet map with landmark directions.
  - 1-click **"Chat with Listing Agent"** WhatsApp direct trigger.

### Surface 2: Management Operations Dashboard (`/dashboard`)
- **Inventory & Media Vault**:
  - Distinguishes **Company Owned** vs. **Managed on Behalf of Owner**.
  - Dual-currency pricing engine (`ZMW` / `USD`) with exchange rate locking.
  - Document vault: Title deeds, tenancy agreements, inspection photos.
- **Commission & Financial Engine**:
  - Lifecycle states: `Expected` $\rightarrow$ `Earned` $\rightarrow$ `Partially Received` $\rightarrow$ `Received` $\rightarrow$ `Agent Paid Out`.
  - Splits: Agency Gross Commission % (e.g. 5%) vs. Listing Agent % (e.g. 50% of agency commission) vs. Closing Agent %.
- **Rental Yield & Arrears Tracker**:
  - Occupancy counter: Total units, Occupied, Vacant, Maintenance hold.
  - Automated rent arrears escalation (Day 1: WhatsApp friendly nudge, Day 7: Overdue notice, Day 14: Final legal notice).
  - 1-Click Landlord Monthly Remittance Statement generator (Gross Rent Collected − 10% Agency Fee − Approved Maintenance = Net Landlord Remittance).
- **Client & Inquiry CRM**:
  - Client budget/location matchmaker.
  - 30-day exclusive client lock per agent to eliminate intra-agency deal poaching.

### Surface 3: Field Agent Mobile PWA Surface (`/kiosk` / `/agent`)
- Designed for low-latency field usage on mobile phones and tablets under spotty 3G/4G connectivity.
- **Interactive Leaflet/GPS Property Map**:
  - 🔴 Red: Available for Sale
  - 🟡 Yellow: Available for Rent
  - 🟢 Green: Sold
  - 🔵 Blue: Rented
  - ⚪ White/Gray: Available Plots / Land
- **Landmark Direction Navigator**: GPS navigation fallback with verified local landmarks.
- **Instant Listing Share**: Generates high-converting WhatsApp cards and branded PDF spec sheets in 1 click.
- **Strict PII Masking**: Field agents see lockbox codes and viewing notes, but **Landlord phone numbers and bank details are masked**.

### Surface 4: Admin Control Plane & Mission Control (`/admin`)
- Central overview of brokerage tenants, container health, and POPIA audit events.
- **Mission Control for Digital Labor**: Dify listing ingestion agent health, auto-reminder dispatch telemetry, and token usage.
- **Interactive MCP Studio (`/admin/mcp`)**: User-scoped API key generator, live tool invocation sandbox, and 1-click compromise revocation.

### Surface 5: Machine & MCP Interface (`/api/mcp` & `public/llms.txt`)
- Model Context Protocol (MCP) server exposing tools: `search_properties`, `match_buyer_criteria`, `log_inquiry`, `get_rental_arrears`, `generate_landlord_statement`.

---

## 4. Boundary & Anti-Scope (What We Refuse to Build in Phase 1)

1. **No Proprietary Payment Gateway**: We do NOT process tenant rent into Contour escrow bank accounts. We track payment confirmations, generate digital receipts, and reconcile bank transfers/mobile money receipts.
2. **No Generic Social Network for Agents**: Contour is an internal brokerage operating system, not a public listing portal competing with Facebook Marketplace.
3. **No Heavy 3D Virtual Tour Renderers**: We prioritize fast, lightweight JPEG/WebP galleries optimized for mobile bandwidth.

---

## 5. Commercial Packaging & Paystack Pricing Tiers

| Tier | Target | Monthly Price (ZAR / USD / ZMW) | Features & Limits |
| :--- | :--- | :--- | :--- |
| **Starter Broker** | Boutique agencies (1-3 agents) | **$49 / mo** (R890 / K1,200) | Up to 50 active listings, 20 managed rental units, basic map, WhatsApp share. |
| **Growth Agency** | Mid-sized agencies (4-15 agents) | **$129 / mo** (R2,350 / K3,200) | Up to 250 listings, 100 rental units, automated rent arrears reminders, Landlord statement generator, full MCP tools. |
| **Enterprise / Multi-Branch** | Large brokerages (16+ agents) | **$299 / mo** (R5,450 / K7,500) | Unlimited listings, unlimited rental units, multi-branch RBAC, dedicated Dify WhatsApp ingestion bot, custom white-label reports. |
