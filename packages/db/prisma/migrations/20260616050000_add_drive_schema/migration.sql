-- CreateEnum
CREATE TYPE "FileAccessRole" AS ENUM ('admin', 'editor', 'viewer');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('image', 'pdf', 'document', 'spreadsheet', 'presentation', 'video', 'archive', 'other');

-- CreateTable
CREATE TABLE "drive_folders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "parent_folder_id" UUID,
    "workspace_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "description" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "folder_id" UUID NOT NULL,
    "blob_url" TEXT NOT NULL,
    "blob_key" TEXT NOT NULL,
    "file_type" "FileType" NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "workspace_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "description" TEXT,
    "listing_id" UUID,
    "lease_id" UUID,
    "deal_id" UUID,
    "client_id" UUID,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_folder_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "folder_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "FileAccessRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_folder_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_file_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "FileAccessRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_file_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drive_folders_workspace_idx" ON "drive_folders"("workspace_id");

-- CreateIndex
CREATE INDEX "drive_folders_parent_idx" ON "drive_folders"("parent_folder_id");

-- CreateIndex
CREATE INDEX "drive_folders_created_by_idx" ON "drive_folders"("created_by_id");

-- CreateIndex
CREATE INDEX "drive_files_workspace_idx" ON "drive_files"("workspace_id");

-- CreateIndex
CREATE INDEX "drive_files_folder_idx" ON "drive_files"("folder_id");

-- CreateIndex
CREATE INDEX "drive_files_created_by_idx" ON "drive_files"("created_by_id");

-- CreateIndex
CREATE INDEX "drive_files_listing_idx" ON "drive_files"("listing_id");

-- CreateIndex
CREATE INDEX "drive_files_deal_idx" ON "drive_files"("deal_id");

-- CreateIndex
CREATE INDEX "drive_files_client_idx" ON "drive_files"("client_id");

-- CreateIndex
CREATE INDEX "drive_files_lease_idx" ON "drive_files"("lease_id");

-- CreateIndex
CREATE INDEX "drive_files_type_idx" ON "drive_files"("file_type");

-- CreateIndex
CREATE UNIQUE INDEX "unique_folder_user_permissions" ON "drive_folder_permissions"("folder_id", "user_id");

-- CreateIndex
CREATE INDEX "drive_folder_perms_user_idx" ON "drive_folder_permissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_file_user_permissions" ON "drive_file_permissions"("file_id", "user_id");

-- CreateIndex
CREATE INDEX "drive_file_perms_user_idx" ON "drive_file_permissions"("user_id");

-- AddForeignKey
ALTER TABLE "drive_folders" ADD CONSTRAINT "drive_folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_folders" ADD CONSTRAINT "drive_folders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "rental_leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_folder_permissions" ADD CONSTRAINT "drive_folder_permissions_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_folder_permissions" ADD CONSTRAINT "drive_folder_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_file_permissions" ADD CONSTRAINT "drive_file_permissions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_file_permissions" ADD CONSTRAINT "drive_file_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
