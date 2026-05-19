import {
  S3Client,
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";

// Storage abstraction. Two drivers:
//   STORAGE_DRIVER=s3 — AWS S3. Credentials come from the default AWS
//     chain (EC2 instance role) — no static keys. Env: S3_BUCKET,
//     S3_REGION (default us-east-1), S3_PUBLIC_BASE_URL (optional).
//   default (r2)      — Cloudflare R2 via the R2_* env vars.
interface StorageConfig {
  driver: "s3" | "r2";
  bucketName: string;
  region: string;
  endpoint?: string;
  credentials?: { accessKeyId: string; secretAccessKey: string };
  publicBase: string;
}

function getConfig(): StorageConfig {
  const driver = (process.env.STORAGE_DRIVER || "r2").toLowerCase();

  if (driver === "s3") {
    const bucketName = process.env.S3_BUCKET;
    const region = process.env.S3_REGION || "us-east-1";
    if (!bucketName) {
      throw new Error("S3 storage: S3_BUCKET is not configured");
    }
    const publicBase =
      process.env.S3_PUBLIC_BASE_URL ||
      `https://${bucketName}.s3.${region}.amazonaws.com`;
    // No credentials/endpoint: SDK uses the default chain (instance role).
    return { driver: "s3", bucketName, region, publicBase };
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error("R2 environment variables are not fully configured");
  }

  return {
    driver: "r2",
    bucketName,
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    publicBase: publicUrl,
  };
}

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const cfg = getConfig();
  s3Client = new S3Client({
    region: cfg.region,
    ...(cfg.endpoint ? { endpoint: cfg.endpoint } : {}),
    ...(cfg.credentials ? { credentials: cfg.credentials } : {}),
  });

  return s3Client;
}

export function getPublicUrl(key: string): string {
  const { publicBase } = getConfig();
  return `${publicBase.replace(/\/$/, "")}/${key}`;
}

export async function uploadVideo(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const { bucketName } = getConfig();
  const client = getS3Client();

  const params: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  };

  await client.send(new PutObjectCommand(params));
  return getPublicUrl(key);
}
