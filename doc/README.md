# Real Estate CRM & Operating System Documentation

Source exported from Notion on 2026-06-12.

## Purpose

This folder turns the Notion workspace into implementation-ready Markdown for the web app and Electron desktop app. The source Notion page is the single source of truth for product strategy, architecture, database schema, CRM operations, offline sync, analytics, document handling, and build sequencing.

## Document Map

- [Source Index](./source-index.md)
- [Real Estate CRM and Operating System](./real-estate-crm-operating-system.md)
- [Contour Analytics Engine Architecture and UX Brief](./contour-analytics-engine-architecture-ux-brief.md)
- [Product PRD, Roadmap, and Go-to-Market](./product-prd-roadmap-gtm.md)
- [Pages and Workflows](./pages-workflows.md)
- [Engineering Architecture, Data, Security, and Offline](./engineering-architecture-data-security-offline.md)
- [System Architecture Offline-First](./system-architecture-offline-first.md)
- [Database Schema Tables and Columns](./database-schema-tables-columns.md)
- [Canonical Neon Postgres DDL](./database-schema-ddl-neon-postgres.md)
- [CRM Properties and Plots Database](./crm-properties-plots-database.md)
- [Analytics Spec](./analytics-spec-kpis-events-insights-workflows.md)
- [Sync Protocol Spec](./sync-protocol-electron-neon.md)
- [Data Quality Rules](./data-quality-rules-work-items.md)
- [Phased Implementation Plan](./implementation-roadmap.md)

## Canonical Decisions

- Product name: Contour Analytics Engine.
- Web runtime: Next.js on Vercel.
- Auth: Clerk.
- Cloud database: Neon Postgres.
- Desktop app: Electron sharing the web UI codebase.
- Document storage: Vercel Blob.
- Analytics: SQL-first and event-driven.
- Offline behavior: desktop app remains usable read/write using last-synced local data.
- Sync: idempotent push/pull with local outbox, client-generated UUIDs for append-only facts, and conflict logging for mutable records.
- CRM data model: use the normalized Neon DDL as canonical where older product docs conflict.
- Visual direction: warm paper-like surfaces, dark brown primary action, restrained typography, operational density, and minimal contour-line brand mark.

## Implementation Note

The Notion database query tool was unavailable during export, so this folder contains the CRM database schema and view configuration, not live row data. Workspace search found no visible rows in the Properties/Plots data source.
