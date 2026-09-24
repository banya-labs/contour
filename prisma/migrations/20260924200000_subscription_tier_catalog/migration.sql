CREATE TABLE "subscription_tier" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "monthlyZmw" DECIMAL(12,2) NOT NULL,
  "annualZmw" DECIMAL(12,2) NOT NULL,
  "monthlyUsd" DECIMAL(12,2) NOT NULL,
  "annualUsd" DECIMAL(12,2) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscription_tier_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subscription_tier_key_key" ON "subscription_tier"("key");
CREATE INDEX "subscription_tier_active_key_idx" ON "subscription_tier"("active", "key");

INSERT INTO "subscription_tier" ("id", "key", "name", "description", "monthlyZmw", "annualZmw", "monthlyUsd", "annualUsd", "updatedAt") VALUES
  ('tier_starter', 'starter', 'Starter Broker', 'For boutique agencies and solo principals.', 1200, 960, 49, 39, CURRENT_TIMESTAMP),
  ('tier_growth', 'growth', 'Growth Agency', 'For scaling mid-sized brokerages.', 3200, 2560, 129, 99, CURRENT_TIMESTAMP),
  ('tier_enterprise', 'enterprise', 'Enterprise Brokerage', 'For multi-branch firms and commercial developers.', 7500, 6000, 299, 239, CURRENT_TIMESTAMP);
