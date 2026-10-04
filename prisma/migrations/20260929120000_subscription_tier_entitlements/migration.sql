ALTER TABLE "subscription_tier"
  ADD COLUMN "maxAgents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxListings" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxRentalUnits" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "subscription_tier"
SET "maxAgents" = CASE "key" WHEN 'starter' THEN 3 WHEN 'growth' THEN 15 ELSE 999 END,
    "maxListings" = CASE "key" WHEN 'starter' THEN 50 WHEN 'growth' THEN 250 ELSE 9999 END,
    "maxRentalUnits" = CASE "key" WHEN 'starter' THEN 20 WHEN 'growth' THEN 100 ELSE 9999 END,
    "features" = CASE "key"
      WHEN 'starter' THEN ARRAY['Up to 50 active listings','20 managed rental units','Interactive Lusaka Leaflet property map','1-Click WhatsApp listing flyer generator','30-Day anti-poaching client registration','Public shareable property cards (/p/[slug])','Lenco Mobile Money (MTN, Airtel, Zamtel) & Card billing']
      WHEN 'growth' THEN ARRAY['Up to 250 active listings & 100 rental units','True 5% Commission & Agent Split Ledger','1-Click Landlord Remittance Statements','The DocuSign Human Approval Seam','PowerSync Offline-First Field PWA (/kiosk)','Public REST API for Corporate Website listings','Reverse Matchmaker buyer-to-property AI alerts']
      ELSE ARRAY['Unlimited listings, agents & rental units','Multi-branch RBAC (Lusaka, Ndola, Livingstone)','Dedicated MinIO S3 object storage partition','Full JSON-RPC 2.0 /api/mcp AI agent tools','Unlimited public API keys & custom webhooks','Dedicated SLA & technical account architect']
    END;
