import type {
  VideoProviderClient,
  GenerateOptions,
  GenerationResult,
  GenerationStatus,
} from "./types";

const LUMA_API_BASE = "https://api.lumalabs.ai/dream-machine/v1";

function getApiKey(): string {
  const key = process.env.LUMA_API_KEY;
  if (!key) throw new Error("LUMA_API_KEY is not set");
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

export const lumaProvider: VideoProviderClient = {
  name: "Luma",
  maxDurationPerCall: 5,
  supportsExtension: true,

  async createGeneration(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerationResult> {
    const body: Record<string, unknown> = {
      prompt,
      model: "ray-flash-2",
      duration: "5s",
    };

    if (options.imageUrl) {
      body.keyframes = {
        frame0: { type: "image", url: options.imageUrl },
      };
    }

    const res = await fetch(`${LUMA_API_BASE}/generations`, {
      method: "POST",
      headers: headers(),
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
      headers: headers(),
    });

    if (!res.ok) {
      throw new Error(`Luma getGeneration failed (${res.status})`);
    }

    const data = await res.json();
    const stateMap: Record<string, GenerationStatus["state"]> = {
      queued: "pending",
      dreaming: "processing",
      completed: "completed",
      failed: "failed",
    };

    return {
      id: data.id,
      state: stateMap[data.state] || "processing",
      videoUrl: data.assets?.video,
      error: data.failure_reason,
    };
  },

  async extendGeneration(
    generationId: string,
    prompt: string
  ): Promise<GenerationResult> {
    const body = {
      prompt,
      model: "ray-flash-2",
      keyframes: {
        frame0: { type: "generation", id: generationId },
      },
    };

    const res = await fetch(`${LUMA_API_BASE}/generations`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Luma extendGeneration failed (${res.status}): ${text}`
      );
    }

    const data = await res.json();
    return { id: data.id };
  },
};
