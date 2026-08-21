# Product PRD, Roadmap, and Go-to-Market

Source: https://app.notion.com/p/1c44750c791d4c01ac08d61088ab4918

## Product Summary

Build a centralized, offline-capable real estate operating system for Zambia that replaces spreadsheet-driven operations. The system manages inventory, properties, plots, portfolio valuation, clients, Zambian KYC, sales pipeline, agent attribution, installment and hire-purchase schedules, rental billing, arrears, document vaults, reporting, reconciliation, analytics, and audit history.

## Target Users and Roles

- Admin/Owner: configuration, reporting, audit, and full operational oversight.
- Agent: listings, clients, interactions, deals, and documents.
- Finance/Collections: receipts, arrears, reconciliation, and collections workflow.
- Legal: delinquency follow-ups, document verification, and compliance checks.

## Goals

- Create one operational source of truth for inventory, client activity, and money owed/paid.
- Support offline-first field usage with fast search and filters.
- Provide a clear pipeline and collections prioritization using 15/30/60+ day aging.
- Produce investor-ready auditability showing who changed what and when.

## MVP Non-Goals

- Do not replace a full accounting package. Export and summarize for accounting instead.
- Do not automate legal enforcement workflows in MVP. Provide lists and logs.
- Do not build complex GIS mapping in MVP. Treat maps as optional later scope.

## Modules and Features

### Module 1: Centralized Inventory and Portfolio Control

- Dynamic inventory dashboard with counters by availability status: available, reserved, rented, sold, and under maintenance.
- Portfolio valuation by total and location using asking or valuation fields.
- Structured property and land profiler for property vs vacant land.
- Advanced offline search by location, price bracket, plot size, and status.

### Module 2: CRM, Client Ledger, and Zambian KYC

- Zambian KYC profile vault for NRC/passport and TPIN.
- Validation rules for format and uniqueness where feasible.
- Client segmentation tags: prospect, active tenant, land owner/seller, and past lead.
- Interaction history timeline for calls, visits, negotiations, and other touchpoints linked to client, deal, and listing.

### Module 3: Sales Pipeline and Deal Tracker

- Visual kanban pipeline by stage: lead, viewing, offer, contract, closed won, closed lost.
- Offline buyer-property matcher using budget, location, and property type.
- Agent attribution across leads and deals.
- Commission reporting.

### Module 4: Installment and Hire-Purchase Engine

- Payment plan constructor using total price, down payment, frequency, periods, and start date.
- Generated amortization and ledger schedule with due dates, paid-to-date, and remaining balance.
- Aging receivables dashboard for 15/30/60+ overdue follow-up.

### Module 5: Rental Income and Arrears Tracker

- Monthly rental billing matrix with manually generated charges in MVP.
- Arrears dashboard for tenants past due, contact details, and debt totals.
- ZMW/USD dual-currency ledger with exchange-rate notes.

### Module 6: Localized Document Vault

- Attachments at listing, client, and deal level.
- Zambian document checklists: title deed, offer letter, survey diagram/site plan, contracts, and leases.

### Module 7: Analytics and Reporting Engine

- Actual vs expected reconciliation for rent and installments.
- Velocity analytics for fastest-selling areas and plot sizes.
- Margin proxies.
- Immutable audit trail for create/edit/delete on key records.

## Data Model Overview

The product page lists these tables:

- Listings
- Clients
- Interactions
- Deals
- Deal participants, if multiple buyers or sellers are needed later
- Payment plans
- Installment schedule
- Rental leases
- Rental charges
- Payments and receipts
- Documents
- Audit log

The canonical implementation must use the normalized Neon DDL in [Canonical Neon Postgres DDL](./database-schema-ddl-neon-postgres.md), because that page supersedes earlier array-based table notes.

## Key Workflows

- Inventory dashboard to add/update listings, attach documents, and link owner/seller.
- Client intake with KYC, interaction logging, deal creation, and listing links.
- Deal stage progression through pipeline, contract, payment plan, or lease.
- Billing cycle posts charges, payments are recorded, and arrears dashboards drive follow-ups.
- Management reporting covers reconciliation, velocity analytics, and agent performance.

## Success Metrics

- Inventory: available count, time on market, conversion rate by area and type.
- Sales: stage conversion, average days in stage, close rate, and average deal value.
- Collections: on-time percentage, arrears totals, recovery rate by aging bucket.
- Rentals: occupancy rate, arrears rate, and average days late.
- Operations quality: KYC completeness percentage, missing document percentage, and audit coverage.

## Recommended MVP Scope

- Listings and inventory dashboard.
- Clients, KYC, and interaction timeline.
- Deals pipeline and agent attribution.
- Payment plans, schedules, and arrears dashboard.
- Basic rental ledger and arrears dashboard.
- Document vault and checklists.
- Core reporting for counts, sums, and aging buckets.

## Later Scope

- Automated monthly billing via external automation.
- Advanced buyer matcher scoring and ML ranking.
- Payment provider integrations.
- Multi-branch permissions and per-branch reporting.
