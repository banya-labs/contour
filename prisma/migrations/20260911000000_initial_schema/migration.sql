-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'BROKER_MANAGER', 'FIELD_AGENT', 'FINANCE_OFFICER', 'LANDLORD', 'TENANT');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('ZMW', 'USD', 'ZAR');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('COMPANY_OWNED', 'MANAGED_ON_BEHALF');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('STANDALONE_HOUSE', 'APARTMENT', 'COMMERCIAL_OFFICE', 'WAREHOUSE', 'VACANT_LAND_PLOT', 'FARM_AGRICULTURAL');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('FOR_SALE', 'FOR_RENT', 'BOTH');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'UNDER_OFFER', 'SOLD', 'RENTED', 'MAINTENANCE_HOLD', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'TERMINATED', 'IN_ARREARS');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'MOBILE_MONEY_AIRTEL', 'MOBILE_MONEY_MTN', 'CASH', 'CHEQUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CONFIRMED', 'PENDING_VERIFICATION', 'BOUNCED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "StatementStatus" AS ENUM ('DRAFT', 'APPROVED_BY_MANAGER', 'SENT_TO_LANDLORD', 'PAID_OUT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PROPERTY_SALE', 'RENTAL_PLACEMENT');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('EXPECTED', 'EARNED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'AGENT_PAID_OUT');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW_INQUIRY', 'CONTACTED', 'VIEWING_SCHEDULED', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('TITLE_DEED', 'NRC_PASSPORT_ID', 'MANDATE_AGREEMENT', 'LEASE_CONTRACT', 'SITE_SURVEY_DIAGRAM', 'PACRA_CERTIFICATE', 'VALUATION_REPORT', 'PROOF_OF_RESIDENCE', 'PAYMENT_RECEIPT', 'CLIENT_CORRESPONDENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "SecurityLevel" AS ENUM ('RESTRICTED_MANAGEMENT', 'CONFIDENTIAL_PII', 'AGENT_ACCESSIBLE');

-- CreateEnum
CREATE TYPE "VaultAccessLevel" AS ENUM ('FULL_VAULT', 'ASSIGNED_ONLY', 'SPECIFIC_FOLDERS');

-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('PENDING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'FIELD_AGENT',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'ZMW',
    "lencoCustomerId" TEXT,
    "lencoSubscriptionId" TEXT,
    "lencoAccountReference" TEXT,
    "paystackCustomerId" TEXT,
    "paystackSubCode" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'STARTER',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "permissions" TEXT[] DEFAULT ARRAY['read:properties', 'write:inquiries']::TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownershipType" "OwnershipType" NOT NULL DEFAULT 'MANAGED_ON_BEHALF',
    "propertyType" "PropertyType" NOT NULL DEFAULT 'STANDALONE_HOUSE',
    "listingType" "ListingType" NOT NULL DEFAULT 'FOR_SALE',
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "askingPrice" DECIMAL(14,2),
    "rentalPrice" DECIMAL(14,2),
    "currency" "Currency" NOT NULL DEFAULT 'ZMW',
    "agencyCommissionPct" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "bedrooms" INTEGER,
    "bathrooms" DECIMAL(3,1),
    "plotSizeSqm" DECIMAL(12,2),
    "description" TEXT NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featuredPhoto" TEXT,
    "suburb" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Lusaka',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "standBoundary" JSONB,
    "landmarkDirections" TEXT,
    "ownerName" TEXT,
    "ownerPhone" TEXT,
    "ownerEmail" TEXT,
    "ownerBankDetails" TEXT,
    "titleDeedNumber" TEXT,
    "assignedAgentId" TEXT,
    "createdById" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lease" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "tenantPhone" TEXT NOT NULL,
    "tenantEmail" TEXT,
    "tenantIdNumber" TEXT,
    "monthlyRent" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZMW',
    "depositAmount" DECIMAL(12,2) NOT NULL,
    "managementFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    "leaseStartDate" TIMESTAMP(3) NOT NULL,
    "leaseEndDate" TIMESTAMP(3) NOT NULL,
    "paymentDayOfMonth" INTEGER NOT NULL DEFAULT 1,
    "status" "LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZMW',
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "referenceNumber" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "reconciledVia" TEXT NOT NULL DEFAULT 'MANUAL',
    "rawPayload" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rent_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_expense" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vendorName" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZMW',
    "receiptPhotoUrl" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'APPROVED',
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landlord_statement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "landlordName" TEXT NOT NULL,
    "statementMonth" INTEGER NOT NULL,
    "statementYear" INTEGER NOT NULL,
    "grossRentCollected" DECIMAL(12,2) NOT NULL,
    "agencyFeeDeducted" DECIMAL(12,2) NOT NULL,
    "maintenanceDeducted" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "netLandlordPayout" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZMW',
    "pdfUrl" TEXT,
    "status" "StatementStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landlord_statement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_arrears_reminder" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "recipientPhone" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rent_arrears_reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL DEFAULT 'PROPERTY_SALE',
    "grossValue" DECIMAL(14,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZMW',
    "agencyCommissionPct" DECIMAL(5,2) NOT NULL,
    "agencyCommissionAmount" DECIMAL(12,2) NOT NULL,
    "agentSplitPct" DECIMAL(5,2) NOT NULL DEFAULT 50.0,
    "agentSplitAmount" DECIMAL(12,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'EXPECTED',
    "closingAgentId" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientEmail" TEXT,
    "lookingFor" "ListingType" NOT NULL DEFAULT 'FOR_SALE',
    "propertyType" "PropertyType",
    "budgetMin" DECIMAL(12,2),
    "budgetMax" DECIMAL(12,2),
    "currency" "Currency" NOT NULL DEFAULT 'ZMW',
    "preferredSuburbs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW_INQUIRY',
    "assignedAgentId" TEXT,
    "exclusiveLockExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_visit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "clientFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "agentType" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "estimatedCostZar" DECIMAL(8,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "docType" "DocumentType" NOT NULL DEFAULT 'TITLE_DEED',
    "classification" "SecurityLevel" NOT NULL DEFAULT 'RESTRICTED_MANAGEMENT',
    "objectKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "registryFolio" TEXT,
    "standPlotNumber" TEXT,
    "nrcNumber" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedByType" TEXT NOT NULL DEFAULT 'STAFF',
    "uploadedById" TEXT,
    "documentRequestId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "sha256Checksum" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_access_grant" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessLevel" "VaultAccessLevel" NOT NULL DEFAULT 'ASSIGNED_ONLY',
    "propertyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "canVerifyDocs" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteDocs" BOOLEAN NOT NULL DEFAULT false,
    "grantedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_access_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_request" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT,
    "inquiryId" TEXT,
    "requestedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "requiredTypes" "DocumentType"[] DEFAULT ARRAY['NRC_PASSPORT_ID']::"DocumentType"[],
    "maxFiles" INTEGER NOT NULL DEFAULT 5,
    "maxSizeMbPerFile" INTEGER NOT NULL DEFAULT 15,
    "token" TEXT NOT NULL,
    "pinHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "clientName" TEXT,
    "clientPhone" TEXT,
    "clientEmail" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentTimestamp" TIMESTAMP(3),
    "consentIp" TEXT,
    "consentUserAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_key_key" ON "api_key"("key");

-- CreateIndex
CREATE INDEX "api_key_organizationId_status_idx" ON "api_key"("organizationId", "status");

-- CreateIndex
CREATE INDEX "property_organizationId_status_idx" ON "property"("organizationId", "status");

-- CreateIndex
CREATE INDEX "property_organizationId_listingType_idx" ON "property"("organizationId", "listingType");

-- CreateIndex
CREATE INDEX "property_organizationId_suburb_idx" ON "property"("organizationId", "suburb");

-- CreateIndex
CREATE UNIQUE INDEX "property_organizationId_slug_key" ON "property"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "lease_organizationId_status_idx" ON "lease"("organizationId", "status");

-- CreateIndex
CREATE INDEX "lease_propertyId_idx" ON "lease"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "rent_payment_receiptNumber_key" ON "rent_payment"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rent_payment_idempotencyKey_key" ON "rent_payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "rent_payment_organizationId_periodYear_periodMonth_idx" ON "rent_payment"("organizationId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "maintenance_expense_organizationId_propertyId_periodYear_pe_idx" ON "maintenance_expense"("organizationId", "propertyId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "landlord_statement_organizationId_statementYear_statementMo_idx" ON "landlord_statement"("organizationId", "statementYear", "statementMonth");

-- CreateIndex
CREATE UNIQUE INDEX "rent_arrears_reminder_idempotencyKey_key" ON "rent_arrears_reminder"("idempotencyKey");

-- CreateIndex
CREATE INDEX "rent_arrears_reminder_organizationId_leaseId_idx" ON "rent_arrears_reminder"("organizationId", "leaseId");

-- CreateIndex
CREATE INDEX "transaction_organizationId_status_idx" ON "transaction"("organizationId", "status");

-- CreateIndex
CREATE INDEX "inquiry_organizationId_status_idx" ON "inquiry"("organizationId", "status");

-- CreateIndex
CREATE INDEX "property_visit_organizationId_scheduledAt_idx" ON "property_visit"("organizationId", "scheduledAt");

-- CreateIndex
CREATE INDEX "audit_log_organizationId_createdAt_idx" ON "audit_log"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_log_organizationId_createdAt_idx" ON "ai_usage_log"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vault_document_objectKey_key" ON "vault_document"("objectKey");

-- CreateIndex
CREATE INDEX "vault_document_organizationId_docType_idx" ON "vault_document"("organizationId", "docType");

-- CreateIndex
CREATE INDEX "vault_document_organizationId_propertyId_idx" ON "vault_document"("organizationId", "propertyId");

-- CreateIndex
CREATE INDEX "vault_document_organizationId_isDeleted_idx" ON "vault_document"("organizationId", "isDeleted");

-- CreateIndex
CREATE INDEX "vault_document_organizationId_createdAt_idx" ON "vault_document"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vault_access_grant_organizationId_userId_key" ON "vault_access_grant"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "document_request_token_key" ON "document_request"("token");

-- CreateIndex
CREATE INDEX "document_request_token_idx" ON "document_request"("token");

-- CreateIndex
CREATE INDEX "document_request_organizationId_status_idx" ON "document_request"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease" ADD CONSTRAINT "lease_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease" ADD CONSTRAINT "lease_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payment" ADD CONSTRAINT "rent_payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payment" ADD CONSTRAINT "rent_payment_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_expense" ADD CONSTRAINT "maintenance_expense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_expense" ADD CONSTRAINT "maintenance_expense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlord_statement" ADD CONSTRAINT "landlord_statement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlord_statement" ADD CONSTRAINT "landlord_statement_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlord_statement" ADD CONSTRAINT "landlord_statement_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_arrears_reminder" ADD CONSTRAINT "rent_arrears_reminder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_arrears_reminder" ADD CONSTRAINT "rent_arrears_reminder_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_closingAgentId_fkey" FOREIGN KEY ("closingAgentId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_visit" ADD CONSTRAINT "property_visit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_visit" ADD CONSTRAINT "property_visit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_visit" ADD CONSTRAINT "property_visit_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_visit" ADD CONSTRAINT "property_visit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_log" ADD CONSTRAINT "ai_usage_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_document" ADD CONSTRAINT "vault_document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_document" ADD CONSTRAINT "vault_document_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_document" ADD CONSTRAINT "vault_document_documentRequestId_fkey" FOREIGN KEY ("documentRequestId") REFERENCES "document_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_access_grant" ADD CONSTRAINT "vault_access_grant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_access_grant" ADD CONSTRAINT "vault_access_grant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_access_grant" ADD CONSTRAINT "vault_access_grant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_request" ADD CONSTRAINT "document_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_request" ADD CONSTRAINT "document_request_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_request" ADD CONSTRAINT "document_request_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_request" ADD CONSTRAINT "document_request_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
