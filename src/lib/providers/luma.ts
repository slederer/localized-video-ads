import type {
  VideoProviderClient,
  GenerateOptions,
  GenerationResult,
  GenerationStatus,
} from "./types";
import { getApiKey } from "@/lib/api-keys";

// Luma Agents API (uni-1, multimodal: image/image_edit/video/video_edit).
// POST /v1/generations -> { id, state, type, model, output[], failure_reason }
// GET  /v1/generations/{id} -> same shape; state in {queued,running?,completed,failed}
// Output URL at output[0].url (presigned ~1h, fine — pipeline re-uploads
// immediately to our R2/S3).
const LUMA_API_BASE = "https://agents.lumalabs.ai/v1";

async function resolveApiKey(): Promise<string> {
  const key = await getApiKey("LUMA");
  if (!key) {
    throw new Error(
      "Luma API key is not configured. Set it at /settings or via LUMA_API_KEY env."
    );
  }
  return key;
}

async function headers(): Promise<Record<string, string>> {
  return {
    Authorization: `Bearer ${await resolveApiKey()}`,
    "Content-Type": "application/json",
  };
}

export const lumaProvider: VideoProviderClient = {
  name: "Luma",
  // uni-1 video typical max-per-call; the API will reject if too long.
  maxDurationPerCall: 8,
  supportsExtension: false,

  async createGeneration(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerationResult> {
    const body: Record<string, unknown> = {
      prompt,
      model: "uni-1",
      type: "video",
      aspect_ratio: "16:9",
      duration: Math.min(options.duration, 8),
    };

    if (options.imageUrl) {
      // Mirror the Agents API's image_edit `source` shape for a first-frame
      // reference; safe to omit if not supported (server ignores or 4xx
      // surfaces via onFailure).
      body.source = { url: options.imageUrl };
    }

    const res = await fetch(`${LUMA_API_BASE}/generations`, {
      method: "POST",
      headers: await headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Luma createGeneration failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return { id: data.id };
  },

  async getGeneration(id: string): Promise<GenerationStatus> {
    const res = await fetch(`${LUMA_API_BASE}/generations/${id}`, {
      headers: await headers(),
    });

    if (!res.ok) {
      throw new Error(`Luma getGeneration failed (${res.status})`);
    }

    const data = await res.json();
    const stateMap: Record<string, GenerationStatus["state"]> = {
      queued: "pending",
      running: "processing",
      processing: "processing",
      completed: "completed",
      failed: "failed",
    };

    const outputs: Array<{ type?: string; url?: string }> = data.output || [];
    const videoOut = outputs.find((o) => o.type === "video") || outputs[0];

    return {
      id: data.id,
      state: stateMap[data.state] || "processing",
      videoUrl: videoOut?.url,
      error: data.failure_reason || undefined,
    };
  },
};
