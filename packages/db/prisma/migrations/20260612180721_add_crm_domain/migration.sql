-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('available', 'reserved', 'sold', 'under_maintenance');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('lead', 'active', 'archived');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('new', 'viewing', 'negotiating', 'contract', 'closed_won', 'closed_lost');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('open', 'won', 'lost');

-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('open', 'in_progress', 'blocked', 'done');

-- CreateEnum
CREATE TYPE "WorkItemTone" AS ENUM ('info', 'warning', 'danger', 'success');

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZMW',
    "owner_name" TEXT,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "ClientStatus" NOT NULL,
    "source" TEXT,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "stage" "DealStage" NOT NULL,
    "value_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZMW',
    "status" "DealStatus" NOT NULL,
    "closed_at" TIMESTAMP(3),
    "listing_id" UUID,
    "client_id" UUID,
    "assigned_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "tone" "WorkItemTone" NOT NULL,
    "status" "WorkItemStatus" NOT NULL,
    "due_at" TIMESTAMP(3),
    "assigned_user_id" UUID,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_created_by_idx" ON "listings"("created_by_user_id");

-- CreateIndex
CREATE INDEX "listings_created_at_idx" ON "listings"("created_at");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_created_by_idx" ON "clients"("created_by_user_id");

-- CreateIndex
CREATE INDEX "clients_created_at_idx" ON "clients"("created_at");

-- CreateIndex
CREATE INDEX "deals_stage_idx" ON "deals"("stage");

-- CreateIndex
CREATE INDEX "deals_status_idx" ON "deals"("status");

-- CreateIndex
CREATE INDEX "deals_assigned_user_idx" ON "deals"("assigned_user_id");

-- CreateIndex
CREATE INDEX "deals_created_at_idx" ON "deals"("created_at");

-- CreateIndex
CREATE INDEX "work_items_status_idx" ON "work_items"("status");

-- CreateIndex
CREATE INDEX "work_items_tone_idx" ON "work_items"("tone");

-- CreateIndex
CREATE INDEX "work_items_assigned_user_idx" ON "work_items"("assigned_user_id");

-- CreateIndex
CREATE INDEX "work_items_due_at_idx" ON "work_items"("due_at");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
