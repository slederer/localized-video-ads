import type {
  VideoProviderClient,
  GenerateOptions,
  GenerationResult,
  GenerationStatus,
} from "./types";

// BytePlus ModelArk (ByteDance) — Seedance 2.0 video generation.
const ARK_API_BASE = "https://ark.ap-southeast.bytepluses.com/api/v3";
const SEEDANCE_MODEL = "dreamina-seedance-2-0-260128";

function getApiKey(): string {
  const key = process.env.SEEDANCE_API_KEY;
  if (!key) throw new Error("SEEDANCE_API_KEY is not set");
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string }; role: string };

export const seedanceProvider: VideoProviderClient = {
  name: "Seedance",
  // Seedance 2.0 generates up to ~12s per call; no native extension API.
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

    const res = await fetch(`${ARK_API_BASE}/contents/generations/tasks`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        model: SEEDANCE_MODEL,
        content,
        duration: options.duration,
        generate_audio: false,
      }),
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
    const res = await fetch(
      `${ARK_API_BASE}/contents/generations/tasks/${id}`,
      { headers: headers() }
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
      // Note: ModelArk video URLs expire after 24h — the pipeline
      // immediately downloads + re-uploads to R2, so this is fine.
      videoUrl: data.content?.video_url,
      error: data.error?.message,
    };
  },
};
