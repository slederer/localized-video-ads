import {
  S3Client,
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";

function getConfig() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error("R2 environment variables are not fully configured");
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const { accountId, accessKeyId, secretAccessKey } = getConfig();
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3Client;
}

export function getPublicUrl(key: string): string {
  const { publicUrl } = getConfig();
  return `${publicUrl.replace(/\/$/, "")}/${key}`;
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
