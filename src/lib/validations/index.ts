import { z } from "zod";

export const CurrencyEnum = z.enum(["ZMW", "USD", "ZAR"]);
export const OwnershipTypeEnum = z.enum(["COMPANY_OWNED", "MANAGED_ON_BEHALF"]);
export const PropertyTypeEnum = z.enum([
  "STANDALONE_HOUSE",
  "APARTMENT",
  "COMMERCIAL_OFFICE",
  "WAREHOUSE",
  "VACANT_LAND_PLOT",
  "FARM_AGRICULTURAL",
]);
export const ListingTypeEnum = z.enum(["FOR_SALE", "FOR_RENT", "BOTH"]);
export const PropertyStatusEnum = z.enum([
  "AVAILABLE",
  "UNDER_OFFER",
  "SOLD",
  "RENTED",
  "MAINTENANCE_HOLD",
  "DRAFT",
  "ARCHIVED",
]);

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
  description: z.string().min(5),
  photos: z.array(z.string()).default([]),
  featuredPhoto: z.string().optional(),
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
  assignedAgentId: z.string().optional(),
});

export const updatePropertySchema = createPropertySchema.partial().extend({
  id: z.string().optional(),
  status: PropertyStatusEnum.optional(),
  assignedAgentName: z.string().optional(),
  assignedAgentPhone: z.string().optional(),
});

export const createLeaseSchema = z.object({
  propertyId: z.string(),
  tenantName: z.string().min(2).max(100),
  tenantPhone: z.string().min(6).max(30),
  tenantEmail: z.string().email().optional(),
  tenantIdNumber: z.string().max(50).optional(),
  monthlyRent: z.number().positive(),
  currency: CurrencyEnum.default("ZMW"),
  depositAmount: z.number().nonnegative().default(0),
  managementFeePercent: z.number().min(0).max(100).default(10.0),
  leaseStartDate: z.string(),
  leaseEndDate: z.string(),
  paymentDayOfMonth: z.number().int().min(1).max(31).default(1),
});

export const recordRentPaymentSchema = z.object({
  leaseId: z.string(),
  amountPaid: z.number().positive(),
  currency: CurrencyEnum.default("ZMW"),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2020).max(2035),
  paymentDate: z.string(),
  paymentMethod: z.enum(["BANK_TRANSFER", "MOBILE_MONEY_AIRTEL", "MOBILE_MONEY_MTN", "CASH", "CHEQUE"]).default("BANK_TRANSFER"),
  referenceNumber: z.string().max(80).optional(),
  idempotencyKey: z.string().optional(),
  notes: z.string().max(300).optional(),
});

export const recordMaintenanceExpenseSchema = z.object({
  propertyId: z.string(),
  description: z.string().min(3).max(200),
  vendorName: z.string().max(100).optional(),
  amount: z.number().positive(),
  currency: CurrencyEnum.default("ZMW"),
  receiptPhotoUrl: z.string().optional(),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2020).max(2035),
});

export const generateLandlordStatementSchema = z.object({
  propertyId: z.string(),
  statementMonth: z.number().int().min(1).max(12),
  statementYear: z.number().int().min(2020).max(2035),
  grossRentCollected: z.number().nonnegative(),
  agencyFeeDeducted: z.number().nonnegative(),
  maintenanceDeducted: z.number().nonnegative().default(0),
  currency: CurrencyEnum.default("ZMW"),
});

export const createInquirySchema = z.object({
  clientName: z.string().min(2).max(100),
  clientPhone: z.string().min(6).max(30),
  clientEmail: z.string().email().optional().or(z.literal("")),
  lookingFor: ListingTypeEnum.default("FOR_SALE"),
  propertyType: PropertyTypeEnum.optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  currency: CurrencyEnum.default("ZMW"),
  preferredSuburbs: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
  assignedAgentId: z.string().optional(),
});

export const publicInquirySchema = z.object({
  org: z.string().min(1),
  clientName: z.string().min(2).max(100),
  clientPhone: z.string().min(6).max(30),
  clientEmail: z.string().email().optional().or(z.literal("")),
  propertyId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});
