# Dify Operational Runbook (SOP): Contour AI Broker Assistant

**Agent Name**: `contour-broker-assistant`  
**Runtime**: Self-hosted Dify Production Cluster (Contabo / Hostinger)  
**Assigned Owner**: Grace Banda (Principal Broker)  
**Review Cadence**: Weekly  
**Version**: 1.0.0  

---

## 1. Purpose & Business Workflow

The **Contour AI Broker Assistant** is an intelligent conversational agent embedded directly into the Contour Real Estate OS. It enables brokerage managers and field agents to:
1. Query the live account inventory via semantic natural language search.
2. Calculate real-time agency commission revenue (distinguishing gross inventory value from earned 5% fees).
3. Monitor rental occupancy and active rent arrears across Lusaka suburbs.
4. Track Title Deed lodgments and state consent statuses at the Ministry of Lands.
5. Configure automated WhatsApp alerts for incoming buyer property criteria.

---

## 2. Connected Data Sources & Tools

| Tool / Data Class | Access Level | Description |
| :--- | :---: | :--- |
| `search_properties` | Read | Queries PostgreSQL + `pgvector` for matching listings by suburb, price, and specs. |
| `get_rental_arrears` | Read | Retrieves tenants with overdue rent balances, days elapsed, and WhatsApp reminder recommendations. |
| `get_revenue_commission` | Read | Aggregates earned 5% agency commissions, gross closed sales volume, and 50% agent splits. |
| `get_property_documents` | Read | Retrieves confidential legal documents (Certificates of Title, Ministry Surveys, Leases) with 15-minute POPIA presigned download URLs strictly isolated to tenant MinIO S3 vault. |
| `create_inquiry_or_lead` | Write | Registers a new prospective buyer/tenant inquiry into Neon PostgreSQL with a 30-day anti-poaching lock. |

---

## 3. Read vs. Write Permissions & Human-in-the-Loop Seams

- **Read Access (Autonomous)**: The agent has unrestricted read access to active properties, public listing flyers, rental occupancy statistics, and buyer inquiry counts.
- **Write Access (Guarded)**:
  - **Landlord Banking & Remittances**: The agent CANNOT authorize bank wires or modify landlord payment details without explicit human authorization via **The DocuSign Seam**.
  - **Client Poaching Protection**: The agent strictly respects the **30-Day Anti-Poaching Lock** on buyer profiles.

---

## 4. Rollback & Kill Switch Protocol

If unexpected model hallucination or agent drift occurs:
1. In the Contour Admin Control Plane (`/admin/mission-control`), toggle the **"Dify Assistant Kill Switch"** to `OFF`.
2. The system will automatically fall back to the deterministic local grounded search engine (`src/app/api/ai/chat/route.ts`).
3. Audit error logs in Dokploy container stream with correlation ID `contour-ai-stream`.
