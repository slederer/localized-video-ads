import { createHash, createHmac } from "crypto";
import type {
  VideoProviderClient,
  GenerateOptions,
  GenerationResult,
  GenerationStatus,
} from "./types";

// BytePlus ModelArk (ByteDance) — Seedance 2.0 video generation.
//
// NOTE: this provider uses Volcano Engine AK/SK signature-V4 auth, not a
// single Bearer key (like veo.ts, it stays on env vars, not the encrypted
// single-string key store):
//   SEEDANCE_ACCESS_KEY   - Volcano Engine Access Key ID
//   SEEDANCE_SECRET_KEY   - Volcano Engine Secret Access Key
//   SEEDANCE_ENDPOINT_ID  - (recommended) ModelArk inference Endpoint ID.
//                           AK/SK auth expects `model` = Endpoint ID; falls
//                           back to the model name if unset.
//   SEEDANCE_REGION       - default "ap-southeast"
//   SEEDANCE_SERVICE      - default "ark"
const ARK_HOST = "ark.ap-southeast.bytepluses.com";
const ARK_API_BASE = `https://${ARK_HOST}/api/v3`;
const SEEDANCE_MODEL = "dreamina-seedance-2-0-260128";

function creds(): { ak: string; sk: string } {
  const ak = process.env.SEEDANCE_ACCESS_KEY;
  const sk = process.env.SEEDANCE_SECRET_KEY;
  if (!ak || !sk) {
    throw new Error(
      "Seedance not configured. Set SEEDANCE_ACCESS_KEY and SEEDANCE_SECRET_KEY env vars."
    );
  }
  return { ak, sk };
}

function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

// Volcano Engine signature V4. Builds the Authorization + signing headers
// for a request to ARK_HOST. Path has no query params for these endpoints.
function signedHeaders(
  method: "GET" | "POST",
  path: string,
  body: string
): Record<string, string> {
  const { ak, sk } = creds();
  const region = process.env.SEEDANCE_REGION || "ap-southeast";
  const service = process.env.SEEDANCE_SERVICE || "ark";

  const now = new Date();
  const xDate =
    now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const shortDate = xDate.slice(0, 8);
  const credentialScope = `${shortDate}/${region}/${service}/request`;
  const payloadHash = sha256Hex(body);
  const contentType = "application/json";

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${ARK_HOST}\n` +
    `x-content-sha256:${payloadHash}\n` +
    `x-date:${xDate}\n`;
  const signedHeaderList = "content-type;host;x-content-sha256;x-date";

  const canonicalRequest = [
    method,
    path,
    "",
    canonicalHeaders,
    signedHeaderList,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "HMAC-SHA256",
    xDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(sk, shortDate);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "request");
  const signature = createHmac("sha256", kSigning)
    .update(stringToSign, "utf8")
    .digest("hex");

  return {
    "Content-Type": contentType,
    Host: ARK_HOST,
    "X-Date": xDate,
    "X-Content-Sha256": payloadHash,
    Authorization:
      `HMAC-SHA256 Credential=${ak}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaderList}, Signature=${signature}`,
  };
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string }; role: string };

export const seedanceProvider: VideoProviderClient = {
  name: "Seedance",
  maxDurationPerCall: 12,
  supportsExtension: false,

  async createGeneration(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerationResult> {
    const content: ContentPart[] = [{ type: "text", text: prompt }];

    if (options.imageUrl) {
      content.push({
        type: "image_url",
        image_url: { url: options.imageUrl },
        role: "first_frame",
      });
    }

    const body = JSON.stringify({
      // AK/SK auth expects the Endpoint ID in `model`; model name as fallback.
      model: process.env.SEEDANCE_ENDPOINT_ID || SEEDANCE_MODEL,
      content,
      duration: options.duration,
      generate_audio: false,
    });

    const path = "/api/v3/contents/generations/tasks";
    const res = await fetch(`${ARK_API_BASE}/contents/generations/tasks`, {
      method: "POST",
      headers: signedHeaders("POST", path, body),
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Seedance createGeneration failed (${res.status}): ${text}`
      );
    }

    const data = await res.json();
    return { id: data.id };
  },

  async getGeneration(id: string): Promise<GenerationStatus> {
    const path = `/api/v3/contents/generations/tasks/${id}`;
    const res = await fetch(
      `${ARK_API_BASE}/contents/generations/tasks/${id}`,
      { headers: signedHeaders("GET", path, "") }
    );

    if (!res.ok) {
      throw new Error(`Seedance getGeneration failed (${res.status})`);
    }

    const data = await res.json();
    const stateMap: Record<string, GenerationStatus["state"]> = {
      queued: "pending",
      running: "processing",
      succeeded: "completed",
      failed: "failed",
      expired: "failed",
      cancelled: "failed",
    };

    return {
      id,
      state: stateMap[data.status] || "processing",
      // ModelArk video URLs expire after 24h — the pipeline downloads +
      // re-uploads to R2 immediately, so this is fine.
      videoUrl: data.content?.video_url,
      error: data.error?.message,
    };
  },
};
