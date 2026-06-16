-- CreateEnum
CREATE TYPE "SyncOperationType" AS ENUM ('create', 'update', 'delete');

-- CreateEnum
CREATE TYPE "SyncOperationStatus" AS ENUM ('pending', 'synced', 'failed', 'conflict');

-- CreateTable
CREATE TABLE "sync_operations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_id" UUID NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "operation_type" "SyncOperationType" NOT NULL,
    "status" "SyncOperationStatus" NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "conflict_resolved" BOOLEAN NOT NULL DEFAULT false,
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_operations_device_status_idx" ON "sync_operations"("device_id", "status");

-- CreateIndex
CREATE INDEX "sync_operations_status_created_idx" ON "sync_operations"("status", "created_at");

-- AddForeignKey
ALTER TABLE "sync_operations" ADD CONSTRAINT "sync_operations_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "sync_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
