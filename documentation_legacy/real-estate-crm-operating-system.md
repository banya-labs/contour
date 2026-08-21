# Real Estate CRM and Operating System

Source: https://app.notion.com/p/ad963d8ed6cb4cd88c4c088f8a2cf0c0

## Purpose

This workspace is the single source of truth for Contour Analytics Engine: product strategy, PRD, go-to-market, system architecture, database schema, and the operational CRM. The system covers inventory, clients, deals, payments, rentals, documents, reporting, offline sync, analytics, and auditability.

## Start Here

- Product: PRD, roadmap, release notes, go-to-market, ICP, positioning, pricing, channels, and sales playbook.
- Engineering: system architecture, data model, APIs, security, and offline-first approach.
- Operations: properties/plots, clients, interactions, deals, payment plans, rental billing, documents, analytics, and audit.

## CRM Databases

- CRM - Properties & Plots: see [CRM Properties and Plots Database](./crm-properties-plots-database.md).

## Subpages

- [Product PRD, Roadmap, and Go-to-Market](./product-prd-roadmap-gtm.md)
- [Engineering Architecture, Data, Security, and Offline](./engineering-architecture-data-security-offline.md)

## Implementation Direction

The implementation should use the engineering page as the technical contract and the product page as the product contract. Where schema documents conflict, use the canonical normalized DDL in [Canonical Neon Postgres DDL](./database-schema-ddl-neon-postgres.md).

The product should be positioned as an analytics-led operating system, not a generic CRM. The main product loop is: operational work creates events, events produce insights, insights create work items, and work completion improves the dataset.

## Required Outcome

Build a real operating system, not a static CRM clone:

- Web app for canonical cloud workflows.
- Electron desktop app for offline field operations.
- Neon Postgres as persistent system of record.
- Vercel Blob for document storage.
- Clerk for user identity and role claims.
- Event-driven analytics that create insights and work items.
