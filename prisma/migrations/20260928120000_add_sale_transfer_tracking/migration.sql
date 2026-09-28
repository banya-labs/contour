CREATE TYPE "SaleTransferStatus" AS ENUM ('SALE_AGREED', 'TRANSFER_IN_PROGRESS', 'TRANSFER_COMPLETE', 'CANCELLED');

ALTER TABLE "transaction"
  ADD COLUMN "transferStatus" "SaleTransferStatus" NOT NULL DEFAULT 'SALE_AGREED',
  ADD COLUMN "transferAttorney" TEXT,
  ADD COLUMN "transferReference" TEXT,
  ADD COLUMN "transferNotes" TEXT,
  ADD COLUMN "depositAmount" DECIMAL(14,2),
  ADD COLUMN "balanceAmount" DECIMAL(14,2),
  ADD COLUMN "transferStartedAt" TIMESTAMP(3),
  ADD COLUMN "transferCompletedAt" TIMESTAMP(3);
