# 04 — API & MCP Tool Contracts: Contour

**Protocol Standard**: Next.js App Router API Routes + Model Context Protocol (MCP) JSON-RPC 2.0  
**Validation Engine**: Zod 3.x with strict input sanitation & Idempotency Key guarantees  
**Author**: Foundation Architect & Agentic Solutions Engineer (Banya Labs)  

---

## 1. Zod Validation Schemas (`src/lib/validations/`)

```typescript
import { z } from "zod";

export const CurrencyEnum = z.enum(["ZMW", "USD", "ZAR"]);
export const OwnershipTypeEnum = z.enum(["COMPANY_OWNED", "MANAGED_ON_BEHALF"]);
export const PropertyTypeEnum = z.enum([
  "STANDALONE_HOUSE",
  "APARTMENT",
  "COMMERCIAL_OFFICE",
  "WAREHOUSE",
  "VACANT_LAND_PLOT",
  "FARM_AGRICULTURAL"
]);
export const ListingTypeEnum = z.enum(["FOR_SALE", "FOR_RENT", "BOTH"]);
export const PropertyStatusEnum = z.enum([
  "AVAILABLE",
  "UNDER_OFFER",
  "SOLD",
  "RENTED",
  "MAINTENANCE_HOLD",
  "DRAFT",
  "ARCHIVED"
]);

// 1. Property Create / Update Schema
export const createPropertySchema = z.object({
  title: z.string().min(3).max(120),
  ownershipType: OwnershipTypeEnum.default("MANAGED_ON_BEHALF"),
  propertyType: PropertyTypeEnum.default("STANDALONE_HOUSE"),
  listingType: ListingTypeEnum.default("FOR_SALE"),
  askingPrice: z.number().positive().optional(),
  rentalPrice: z.number().positive().optional(),
  currency: CurrencyEnum.default("ZMW"),
  agencyCommissionPct: z.number().min(0).max(100).default(5.0),
  bedrooms: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().min(0).max(50).optional(),
  plotSizeSqm: z.number().positive().optional(),
  description: z.string().min(10),
  photos: z.array(z.string().url()).default([]),
  featuredPhoto: z.string().url().optional(),
  suburb: z.string().min(2).max(80),
  city: z.string().default("Lusaka"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  landmarkDirections: z.string().max(500).optional(),
  ownerName: z.string().max(100).optional(),
  ownerPhone: z.string().max(30).optional(),
  ownerEmail: z.string().email().optional(),
  ownerBankDetails: z.string().max(500).optional(),
  titleDeedNumber: z.string().max(60).optional(),
  assignedAgentId: z.string().cuid().optional(),
});

// 2. Lease & Rent Payment Schema
export const createLeaseSchema = z.object({
  propertyId: z.string().cuid(),
  tenantName: z.string().min(2).max(100),
  tenantPhone: z.string().min(6).max(30),
  tenantEmail: z.string().email().optional(),
  tenantIdNumber: z.string().max(50).optional(),
  monthlyRent: z.number().positive(),
  currency: CurrencyEnum.default("ZMW"),
  depositAmount: z.number().nonnegative(),
  managementFeePercent: z.number().min(0).max(100).default(10.0),
  leaseStartDate: z.string().datetime(),
  leaseEndDate: z.string().datetime(),
  paymentDayOfMonth: z.number().int().min(1).max(31).default(1),
});

export const recordRentPaymentSchema = z.object({
  leaseId: z.string().cuid(),
  amountPaid: z.number().positive(),
  currency: CurrencyEnum.default("ZMW"),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2020).max(2035),
  paymentDate: z.string().datetime(),
  paymentMethod: z.enum(["BANK_TRANSFER", "MOBILE_MONEY_AIRTEL", "MOBILE_MONEY_MTN", "CASH", "CHEQUE"]),
  referenceNumber: z.string().max(80).optional(),
  idempotencyKey: z.string().min(10).max(128).optional(),
  notes: z.string().max(300).optional(),
});

// 3. Maintenance Expense Schema (Offsets against gross rent)
export const recordMaintenanceExpenseSchema = z.object({
  propertyId: z.string().cuid(),
  description: z.string().min(3).max(200),
  vendorName: z.string().max(100).optional(),
  amount: z.number().positive(),
  currency: CurrencyEnum.default("ZMW"),
  receiptPhotoUrl: z.string().url().optional(),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2020).max(2035),
});

// 4. Landlord Statement Generation & Seam Approval Schema
export const generateLandlordStatementSchema = z.object({
  propertyId: z.string().cuid(),
  statementMonth: z.number().int().min(1).max(12),
  statementYear: z.number().int().min(2020).max(2035),
  grossRentCollected: z.number().nonnegative(),
  agencyFeeDeducted: z.number().nonnegative(),
  maintenanceDeducted: z.number().nonnegative().default(0),
  currency: CurrencyEnum.default("ZMW"),
});

export const approveLandlordStatementSeamSchema = z.object({
  statementId: z.string().cuid(),
  confirmedPayoutAmount: z.number().positive(),
  payoutMethod: z.enum(["BANK_TRANSFER", "MOBILE_MONEY", "CHEQUE"]),
  signedAuthorization: z.boolean().refine(val => val === true, {
    message: "Human authorization is required to execute Landlord payout"
  }),
});

// 5. Inquiry Schema
export const createInquirySchema = z.object({
  clientName: z.string().min(2).max(100),
  clientPhone: z.string().min(6).max(30),
  clientEmail: z.string().email().optional(),
  lookingFor: ListingTypeEnum.default("FOR_SALE"),
  propertyType: PropertyTypeEnum.optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  currency: CurrencyEnum.default("ZMW"),
  preferredSuburbs: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
  assignedAgentId: z.string().cuid().optional(),
});
```

---

## 2. Dynamic `/api/mcp` Server Tool Grid (Model Context Protocol)

External AI agents (Antigravity, Claude Desktop, Cursor) authenticate with User-Scoped Bearer tokens (`ApiKey` table) and execute these deterministic operational tools:

### Tool 1: `search_properties`
- **Description**: Search available listings by suburb, budget range, property type, and bedrooms (PII-masked).
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "suburb": { "type": "string", "description": "e.g. Kabulonga, Woodlands" },
      "listingType": { "type": "string", "enum": ["FOR_SALE", "FOR_RENT"] },
      "maxPrice": { "type": "number" },
      "currency": { "type": "string", "enum": ["ZMW", "USD"] },
      "minBedrooms": { "type": "integer" }
    }
  }
  ```

### Tool 2: `match_buyer_criteria`
- **Description**: Semantic vector similarity match between a natural language buyer brief and available catalog listings using `pgvector`.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "e.g. 4 bedroom house with a swimming pool and borehole near AIS in Kabulonga under $2,500/mo" },
      "limit": { "type": "integer", "default": 5 }
    },
    "required": ["query"]
  }
  ```

### Tool 3: `get_rental_arrears`
- **Description**: Returns all tenants currently overdue on rent, calculated days past due, escalation tier, and last payment date for automated WhatsApp follow-ups.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "minDaysOverdue": { "type": "integer", "default": 5 }
    }
  }
  ```

### Tool 4: `generate_landlord_statement`
- **Description**: Automatically reconciles monthly rent collected for a property, deducts management commission and verified maintenance expenses, and returns a draft statement awaiting DocuSign Seam authorization.

### Tool 5: `record_whatsapp_intake_draft`
- **Description**: Stages a new property listing parsed from an agent's WhatsApp voice note or message in `DRAFT` status.

---

## 3. Semantic Markdown Spec (`public/llms.txt`)

```markdown
# Contour — Machine API Contract
> The Real Estate Operations & Field Agent Operating System for Southern Africa.

## Endpoints:
- MCP JSON-RPC Server: POST /api/mcp
- Header: Authorization: Bearer <CONTOUR_API_KEY>

## Capabilities:
- Live property inventory search with landmark navigation.
- Real-time rental arrears tracking with multi-tier idempotency keys.
- Automated Landlord monthly remittance calculation with maintenance audit offsets.
- Semantic vector matchmaking across Lusaka suburbs.
```
