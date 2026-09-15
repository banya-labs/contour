-- Contour High-Performance Database Indexes
-- Automatically applied to accelerate tenant filtering, CRM lead tracking, and cadastral spatial lookups.

-- 1. Session Indexes
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");

-- 2. Member Indexes
CREATE INDEX IF NOT EXISTS "member_userId_idx" ON "member"("userId");

-- 3. Property Indexes
CREATE INDEX IF NOT EXISTS "property_organizationId_createdAt_idx" ON "property"("organizationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "property_assignedAgentId_idx" ON "property"("assignedAgentId");

-- 4. Landlord Statement Indexes
CREATE INDEX IF NOT EXISTS "landlord_statement_organizationId_status_idx" ON "landlord_statement"("organizationId", "status");

-- 5. Transaction Indexes
CREATE INDEX IF NOT EXISTS "transaction_organizationId_createdAt_idx" ON "transaction"("organizationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "transaction_propertyId_idx" ON "transaction"("propertyId");
CREATE INDEX IF NOT EXISTS "transaction_closingAgentId_idx" ON "transaction"("closingAgentId");

-- 6. Inquiry / CRM Client Indexes
CREATE INDEX IF NOT EXISTS "inquiry_organizationId_createdAt_idx" ON "inquiry"("organizationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "inquiry_assignedAgentId_idx" ON "inquiry"("assignedAgentId");
