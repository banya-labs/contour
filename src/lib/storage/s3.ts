import { HeadBucketCommand, HeadObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { Agent as HttpsAgent } from "node:https";

export type StorageCategory =
  | "ORGANIZATION_LOGO"
  | "PROPERTY_PHOTO"
  | "SITE_SURVEY_DIAGRAM"
  | "TITLE_DEED"
  | "NRC_PASSPORT_ID"
  | "MANDATE_AGREEMENT"
  | "LEASE_CONTRACT";

export type StorageMetadata = {
  organizationId: string;
  category: StorageCategory;
  securityLevel: "RESTRICTED_MANAGEMENT" | "CONFIDENTIAL_PII" | "AGENT_ACCESSIBLE" | "PUBLIC";
  uploadedBy: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  registryFolio?: string;
};

type PresignedUpload = {
  uploadUrl: string;
  objectKey: string;
  publicCdnUrl: string;
};

const MAX_PRESIGN_SECONDS = 900;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for S3 storage`);
  return value;
}

function sanitizeFileName(fileName: string): string {
  const normalized = fileName.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
  return normalized.slice(0, 160) || "file";
}

export class S3StorageService {
  private readonly bucketName: string;
  private readonly endpoint: string | undefined;
  private readonly region: string;
  private client: S3Client | undefined;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || "contour-vault";
    this.endpoint = process.env.S3_ENDPOINT || undefined;
    this.region = process.env.S3_REGION || "auto";
  }

  isConfigured(): boolean {
    return Boolean(
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_ENDPOINT
    );
  }

  async ping(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      await this.getClient().send(new HeadBucketCommand({ Bucket: this.bucketName }));
      return true;
    } catch {
      return false;
    }
  }

  private getClient(): S3Client {
    if (!this.client) {
      const accessKeyId = getRequiredEnv("S3_ACCESS_KEY_ID");
      const secretAccessKey = getRequiredEnv("S3_SECRET_ACCESS_KEY");
      
      const allowSelfSigned =
        process.env.NODE_ENV !== "production" ||
        process.env.S3_TLS_REJECT_UNAUTHORIZED === "false";

      // Dynamically instantiate default handler with connection timeout and SSL resilience
      let customRequestHandler: any = undefined;
      try {
        const dummyClient = new S3Client({ region: this.region });
        const HandlerClass = dummyClient.config.requestHandler?.constructor as any;
        if (HandlerClass) {
          customRequestHandler = new HandlerClass({
            httpsAgent: new HttpsAgent({
              rejectUnauthorized: !allowSelfSigned,
              keepAlive: true,
            }),
            connectionTimeout: 4000,
            requestTimeout: 8000,
          });
        }
      } catch {
        // Fall back to default handler if custom instantiation fails
      }

      this.client = new S3Client({
        region: this.region,
        endpoint: this.endpoint,
        forcePathStyle: Boolean(this.endpoint),
        credentials: { accessKeyId, secretAccessKey },
        ...(customRequestHandler ? { requestHandler: customRequestHandler } : {}),
      });
    }
    return this.client;
  }

  generateObjectKey(organizationId: string, category: StorageCategory, fileName: string): string {
    if (!organizationId) throw new Error("organizationId is required for storage keys");
    return `${organizationId}/${category.toLowerCase()}/${Date.now()}_${sanitizeFileName(fileName)}`;
  }

  private getPublicUrl(objectKey: string): string {
    const publicDomain = process.env.S3_PUBLIC_DOMAIN;
    return publicDomain ? `${publicDomain.replace(/\/$/, "")}/${this.bucketName}/${objectKey}` : "";
  }

  async getPresignedUploadUrl(
    organizationId: string,
    category: StorageCategory,
    fileName: string,
    mimeType: string,
  ): Promise<PresignedUpload> {
    const objectKey = this.generateObjectKey(organizationId, category, fileName);
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: mimeType || "application/octet-stream",
      Metadata: {
        organizationId,
        category,
        originalFileName: sanitizeFileName(fileName),
      },
    });
    const uploadUrl = await getSignedUrl(this.getClient(), command, { expiresIn: MAX_PRESIGN_SECONDS });

    return { uploadUrl, objectKey, publicCdnUrl: this.getPublicUrl(objectKey) };
  }

  async putObject(objectKey: string, body: ArrayBuffer | Uint8Array, contentType: string): Promise<void> {
    await this.getClient().send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      Body: body instanceof ArrayBuffer ? new Uint8Array(body) : body,
      ContentType: contentType || "application/octet-stream",
    }));
  }

  async getPresignedDownloadUrl(objectKey: string, expiresInSeconds = MAX_PRESIGN_SECONDS): Promise<string> {
    const expiresIn = Math.min(Math.max(expiresInSeconds, 1), MAX_PRESIGN_SECONDS);
    return getSignedUrl(
      this.getClient(),
      new GetObjectCommand({ Bucket: this.bucketName, Key: objectKey }),
      { expiresIn },
    );
  }

  async getObject(objectKey: string): Promise<{ body: Buffer; contentType: string; contentLength: number }> {
    const result = await this.getClient().send(new GetObjectCommand({ Bucket: this.bucketName, Key: objectKey }));
    const streamToBuffer = async (stream: any): Promise<Buffer> => {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    };
    const body = result.Body ? await streamToBuffer(result.Body) : Buffer.alloc(0);
    return {
      body,
      contentType: result.ContentType || "application/octet-stream",
      contentLength: result.ContentLength ?? body.length,
    };
  }

  async headObject(objectKey: string): Promise<{ contentLength: number; contentType: string; etag?: string }> {
    const result = await this.getClient().send(new HeadObjectCommand({ Bucket: this.bucketName, Key: objectKey }));
    return {
      contentLength: result.ContentLength ?? 0,
      contentType: result.ContentType || "application/octet-stream",
      etag: result.ETag,
    };
  }
}

export const s3Storage = new S3StorageService();
