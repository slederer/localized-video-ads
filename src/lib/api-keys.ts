import { db } from "@/lib/db";
import { encryptApiKey, decryptApiKey } from "@/lib/crypto/api-key-encryption";

export const SUPPORTED_API_KEY_PROVIDERS = [
  "RUNWAY",
  "LUMA",
  "VEO",
  "KLING",
  "MINIMAX",
  "RESEND",
  "UPLOADTHING_TOKEN",
] as const;

export type ApiKeyProvider = (typeof SUPPORTED_API_KEY_PROVIDERS)[number];

const ENV_FALLBACKS: Record<ApiKeyProvider, string> = {
  RUNWAY: "RUNWAY_API_KEY",
  LUMA: "LUMA_API_KEY",
  VEO: "GOOGLE_APPLICATION_CREDENTIALS",
  KLING: "KLING_API_KEY",
  MINIMAX: "MINIMAX_API_KEY",
  RESEND: "RESEND_API_KEY",
  UPLOADTHING_TOKEN: "UPLOADTHING_TOKEN",
};

export async function getApiKey(provider: ApiKeyProvider): Promise<string | null> {
  const row = await db.apiKey.findUnique({ where: { provider } });
  if (row) {
    try {
      return decryptApiKey({
        ciphertext: row.ciphertext,
        iv: row.iv,
        tag: row.tag,
      });
    } catch (err) {
      console.error(`[api-keys] decrypt failed for ${provider}:`, err);
      return null;
    }
  }
  const envName = ENV_FALLBACKS[provider];
  const fromEnv = envName ? process.env[envName] : undefined;
  if (fromEnv) {
    console.warn(
      `[api-keys] using env fallback ${envName} for ${provider} — set via /settings to persist in DB`
    );
    return fromEnv;
  }
  return null;
}

export async function setApiKey(
  provider: ApiKeyProvider,
  plaintext: string,
  updatedBy: string | null
): Promise<void> {
  const { ciphertext, iv, tag } = encryptApiKey(plaintext);
  await db.apiKey.upsert({
    where: { provider },
    create: { provider, ciphertext, iv, tag, updatedBy },
    update: { ciphertext, iv, tag, updatedBy },
  });
}

export async function deleteApiKey(provider: ApiKeyProvider): Promise<void> {
  await db.apiKey.deleteMany({ where: { provider } });
}

export type ApiKeyStatus = {
  provider: ApiKeyProvider;
  hasKey: boolean;
  source: "db" | "env" | "missing";
  updatedAt: Date | null;
};

export async function listApiKeyStatuses(): Promise<ApiKeyStatus[]> {
  const rows = await db.apiKey.findMany();
  const byProvider = new Map(rows.map((r) => [r.provider, r]));
  return SUPPORTED_API_KEY_PROVIDERS.map((provider) => {
    const row = byProvider.get(provider);
    if (row) {
      return {
        provider,
        hasKey: true,
        source: "db" as const,
        updatedAt: row.updatedAt,
      };
    }
    const envName = ENV_FALLBACKS[provider];
    const fromEnv = envName ? process.env[envName] : undefined;
    if (fromEnv) {
      return { provider, hasKey: true, source: "env" as const, updatedAt: null };
    }
    return { provider, hasKey: false, source: "missing" as const, updatedAt: null };
  });
}
