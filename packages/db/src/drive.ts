import type { PrismaClient } from '@prisma/client';
import { FileAccessRole, FileType } from '@prisma/client';

/**
 * Drive Operations - Folder Management
 */

export async function createDriveFolder(
  prisma: PrismaClient,
  data: {
    name: string;
    workspaceId: string;
    createdById: string;
    parentFolderId?: string;
    description?: string;
  },
) {
  return prisma.driveFolder.create({
    data: {
      name: data.name,
      workspaceId: data.workspaceId,
      createdById: data.createdById,
      parentFolderId: data.parentFolderId,
      description: data.description,
    },
    include: {
      createdByUser: { select: { id: true, fullName: true, email: true } },
      childFolders: true,
      permissions: { include: { user: { select: { id: true, fullName: true } } } },
    },
  });
}

export async function getDriveFolder(
  prisma: PrismaClient,
  folderId: string,
) {
  return prisma.driveFolder.findUnique({
    where: { id: folderId },
    include: {
      createdByUser: { select: { id: true, fullName: true, email: true } },
      parentFolder: { select: { id: true, name: true } },
      childFolders: { select: { id: true, name: true, updatedAt: true } },
      files: {
        select: {
          id: true,
          name: true,
          fileType: true,
          fileSize: true,
          createdAt: true,
          createdByUser: { select: { fullName: true } },
        },
      },
      permissions: { include: { user: { select: { id: true, fullName: true, role: true } } } },
    },
  });
}

export async function listDriveFolders(
  prisma: PrismaClient,
  parentFolderId: string | null,
  workspaceId: string,
) {
  return prisma.driveFolder.findMany({
    where: {
      parentFolderId,
      workspaceId,
      isArchived: false,
    },
    include: {
      createdByUser: { select: { fullName: true } },
      _count: { select: { childFolders: true, files: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function updateDriveFolder(
  prisma: PrismaClient,
  folderId: string,
  data: {
    name?: string;
    description?: string;
    isArchived?: boolean;
  },
) {
  return prisma.driveFolder.update({
    where: { id: folderId },
    data,
    include: {
      createdByUser: { select: { id: true, fullName: true } },
    },
  });
}

export async function deleteDriveFolder(
  prisma: PrismaClient,
  folderId: string,
) {
  // Soft delete - archive instead
  return prisma.driveFolder.update({
    where: { id: folderId },
    data: { isArchived: true },
  });
}

/**
 * Drive Operations - File Management
 */

export async function uploadDriveFile(
  prisma: PrismaClient,
  data: {
    name: string;
    folderId: string;
    workspaceId: string;
    createdById: string;
    blobUrl: string;
    blobKey: string;
    fileType: FileType;
    mimeType: string;
    fileSize: bigint;
    description?: string;
    listingId?: string;
    dealId?: string;
    clientId?: string;
    leaseId?: string;
  },
) {
  return prisma.driveFile.create({
    data,
    include: {
      createdByUser: { select: { id: true, fullName: true } },
      folder: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true } },
      deal: { select: { id: true, title: true } },
      client: { select: { id: true, fullName: true } },
      lease: { select: { id: true, leaseName: true } },
    },
  });
}

export async function getDriveFile(
  prisma: PrismaClient,
  fileId: string,
) {
  return prisma.driveFile.findUnique({
    where: { id: fileId },
    include: {
      createdByUser: { select: { id: true, fullName: true, email: true } },
      folder: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true } },
      deal: { select: { id: true, title: true } },
      client: { select: { id: true, fullName: true } },
      lease: { select: { id: true, leaseName: true } },
      permissions: { include: { user: { select: { id: true, fullName: true, role: true } } } },
    },
  });
}

export async function listDriveFiles(
  prisma: PrismaClient,
  folderId: string,
) {
  return prisma.driveFile.findMany({
    where: {
      folderId,
      isArchived: false,
    },
    include: {
      createdByUser: { select: { fullName: true } },
      listing: { select: { id: true, title: true } },
      deal: { select: { id: true, title: true } },
      client: { select: { id: true, fullName: true } },
      lease: { select: { id: true, leaseName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function searchDriveFiles(
  prisma: PrismaClient,
  workspaceId: string,
  query: string,
  options?: {
    fileType?: FileType;
    listingId?: string;
    dealId?: string;
    clientId?: string;
    leaseId?: string;
    limit?: number;
    offset?: number;
  },
) {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const where = {
    workspaceId,
    isArchived: false,
    ...(query && {
      name: {
        search: query.split(' ').join(' | '),
      },
    }),
    ...(options?.fileType && { fileType: options.fileType }),
    ...(options?.listingId && { listingId: options.listingId }),
    ...(options?.dealId && { dealId: options.dealId }),
    ...(options?.clientId && { clientId: options.clientId }),
    ...(options?.leaseId && { leaseId: options.leaseId }),
  };

  const [files, total] = await Promise.all([
    prisma.driveFile.findMany({
      where,
      include: {
        createdByUser: { select: { fullName: true } },
        folder: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
        client: { select: { id: true, fullName: true } },
        lease: { select: { id: true, leaseName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.driveFile.count({ where }),
  ]);

  return { files, total };
}

export async function updateDriveFile(
  prisma: PrismaClient,
  fileId: string,
  data: {
    name?: string;
    description?: string;
    isArchived?: boolean;
    listingId?: string | null;
    dealId?: string | null;
    clientId?: string | null;
    leaseId?: string | null;
  },
) {
  return prisma.driveFile.update({
    where: { id: fileId },
    data,
    include: {
      createdByUser: { select: { fullName: true } },
      listing: { select: { id: true, title: true } },
      deal: { select: { id: true, title: true } },
      client: { select: { id: true, fullName: true } },
    },
  });
}

export async function incrementDownloadCount(
  prisma: PrismaClient,
  fileId: string,
) {
  return prisma.driveFile.update({
    where: { id: fileId },
    data: { downloadCount: { increment: 1 } },
  });
}

export async function deleteDriveFile(
  prisma: PrismaClient,
  fileId: string,
) {
  // Soft delete - archive instead
  return prisma.driveFile.update({
    where: { id: fileId },
    data: { isArchived: true },
  });
}

/**
 * Drive Operations - Permissions
 */

export async function setFolderPermission(
  prisma: PrismaClient,
  folderId: string,
  userId: string,
  role: FileAccessRole,
) {
  return prisma.driveFolderPermission.upsert({
    where: {
      unique_folder_user_permissions: {
        folderId,
        userId,
      },
    },
    update: { role },
    create: { folderId, userId, role },
    include: { user: { select: { id: true, fullName: true, role: true } } },
  });
}

export async function setFilePermission(
  prisma: PrismaClient,
  fileId: string,
  userId: string,
  role: FileAccessRole,
) {
  return prisma.driveFilePermission.upsert({
    where: {
      unique_file_user_permissions: {
        fileId,
        userId,
      },
    },
    update: { role },
    create: { fileId, userId, role },
    include: { user: { select: { id: true, fullName: true, role: true } } },
  });
}

export async function removeFolderPermission(
  prisma: PrismaClient,
  folderId: string,
  userId: string,
) {
  return prisma.driveFolderPermission.delete({
    where: {
      unique_folder_user_permissions: {
        folderId,
        userId,
      },
    },
  });
}

export async function removeFilePermission(
  prisma: PrismaClient,
  fileId: string,
  userId: string,
) {
  return prisma.driveFilePermission.delete({
    where: {
      unique_file_user_permissions: {
        fileId,
        userId,
      },
    },
  });
}

/**
 * Access Control Helper
 */

export async function userHasAccessToFile(
  prisma: PrismaClient,
  fileId: string,
  userId: string,
  userRole: string,
): Promise<boolean> {
  // Admins can access all files
  if (userRole === 'admin') {
    return true;
  }

  const file = await prisma.driveFile.findUnique({
    where: { id: fileId },
    select: {
      createdById: true,
      permissions: { where: { userId } },
    },
  });

  if (!file) return false;

  // File creator has access
  if (file.createdById === userId) return true;

  // Check explicit permissions
  return file.permissions.length > 0;
}

export async function userHasAccessToFolder(
  prisma: PrismaClient,
  folderId: string,
  userId: string,
  userRole: string,
): Promise<boolean> {
  // Admins can access all folders
  if (userRole === 'admin') {
    return true;
  }

  const folder = await prisma.driveFolder.findUnique({
    where: { id: folderId },
    select: {
      createdById: true,
      permissions: { where: { userId } },
    },
  });

  if (!folder) return false;

  // Folder creator has access
  if (folder.createdById === userId) return true;

  // Check explicit permissions
  return folder.permissions.length > 0;
}
