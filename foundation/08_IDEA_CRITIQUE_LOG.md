# 08 — Idea Critique Log & Operational Stress Tests: Contour

**Origin**: Idea Critic & Matt Murphy Readiness Playbook  
**Status**: Approved for Scoped MVP Build  
**Author**: Idea Critic & Foundation Architect (Banya Labs)  

---

## 1. The Three-Bucket Automation Scoping Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THREE-BUCKET AUTOMATION AUDIT                        │
├────────────────────────────────────────────────────────────────────────┤
│ Bucket 1 (Hate Drains)    → 100% Automate (Arrears chasing, Statement  │
│                             calculations, Flyer generation)            │
│ Bucket 2 (Choking Volume) → Automate Intake, Human Gate (Lead matching,│
│                             Viewing scheduling, Ingestion drafts)      │
│ Bucket 3 (Identity Core)  → Never Automate (Landlord mandate closing,  │
│                             High-stakes price & lease negotiations)    │
└────────────────────────────────────────────────────────────────────────┘
```

| Bucket | Workflow Tasks | Automation Strategy | Human-in-the-Loop Seam |
| :--- | :--- | :--- | :--- |
| **Bucket 1: Hate Drains** *(Repetitive toil staff want off desks)* | • Rent arrears chasing & overdue notices<br>• Generating tenant receipts & monthly invoices<br>• Landlord remittance math (Gross rent − Fee − Maintenance)<br>• Commission split calculations | **Automate 100%** via scheduled cron jobs, Dify automated WhatsApp reminders, and ledger math triggers. | Zero-touch automated notifications; manager alerted only when arrears exceed 30 days. |
| **Bucket 2: Enjoyable but Choking** *(High volume tasks that bottleneck throughput)* | • Inquiry intake from Facebook/WhatsApp<br>• Matching buyer budget/location to catalog<br>• Drafting property listing specs from photos<br>• Scheduling property viewings | **Automate volume** with AI pre-qualification and semantic matchmaking; deliver pre-matched hot leads to assigned agents. | Human Agent confirms viewing appointment and attends physically with client. |
| **Bucket 3: Identity-Critical** *(High-stakes trust & relationship building)* | • Final price and lease terms negotiation<br>• Signing exclusive landlord representation mandates<br>• High-net-worth investor advisory<br>• Resolving landlord-tenant legal disputes | **Never automate directly.** Equip managers and agents with historical yield logs, lease records, and audit trails. | 100% Human closed with manager co-signature. |

---

## 2. Downstream Blast Radius & Operational Traps

### Trap 1: The "Agent Data Entry Strike"
- **Threat**: Real estate agents in Zambia spend 80% of their working day in the field on WhatsApp. If adding a property requires sitting at a laptop and filling out 20 form fields, they will abandon the tool within 30 days.
- **Resolution**: Implemented **WhatsApp-First Ingestion**. Agents forward photos, audio notes, and GPS pins to the agency WhatsApp bot, which automatically creates a draft listing for 1-click manager approval.

### Trap 2: Disintermediation & Rogue Agent Deal-Poaching
- **Threat**: Junior agents obtaining landlord direct phone numbers and bank details may bypass the agency to pocket 100% of the commission under the table.
- **Resolution**: Strict RBAC field masking. Field agents access viewing notes and gate lockbox codes, while **Landlord PII and bank details remain locked to Management**.

### Trap 3: Dual-Currency Volatility (ZMW vs USD)
- **Threat**: Prime Lusaka rentals (Kabulonga, Leopards Hill) are quoted in USD, while standard middle-market properties are in ZMW. Hardcoding a single currency corrupts financial accounting.
- **Resolution**: Native dual-currency data model with currency toggles and exchange rate locking at transaction close.

### Trap 4: Unstandardized Addresses & Lusaka Coordinates
- **Threat**: Street numbers are missing or unreliable across many Lusaka suburbs.
- **Resolution**: Leaflet GPS coordinates + structured **Landmark Directions** field (*"150m off Leopards Hill Rd opposite AIS"*).

---

## 3. Foundation Verification & Next Steps

All 8 Foundation documents are successfully authored and verified:
1. `foundation/01_PRODUCT_SPECIFICATION.md` (PRD)
2. `foundation/02_SYSTEM_ARCHITECTURE.md` (Topology & Surface Map)
3. `foundation/03_DATABASE_SCHEMA.md` (Prisma Models & pgvector)
4. `foundation/04_API_MCP_CONTRACTS.md` (Zod Schemas & /api/mcp)
5. `foundation/05_DESIGN_SYSTEM.md` (Elicit / Founder's Ledger Tokens)
6. `foundation/06_GTM_COMMERCIALS.md` (Landing Copy & Paystack Tiers)
7. `foundation/07_PRODUCTION_AUDIT_13_LAYERS.md` (13-Layer Matrix)
8. `foundation/08_IDEA_CRITIQUE_LOG.md` (Readiness & Anti-Sprawl Rules)

**Next Action**: Hand off to `/banya-fullstack-builder` to implement the scoped MVP surfaces and database models.
