import type {
  VideoProviderClient,
  GenerateOptions,
  GenerationResult,
  GenerationStatus,
} from "./types";

const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";

function getApiKey(): string {
  const key = process.env.RUNWAY_API_KEY;
  if (!key) throw new Error("RUNWAY_API_KEY is not set");
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    "X-Runway-Version": "2024-11-06",
  };
}

export const runwayProvider: VideoProviderClient = {
  name: "Runway",
  maxDurationPerCall: 10,
  supportsExtension: false,

  async createGeneration(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerationResult> {
    const duration = Math.min(options.duration, 10);
    const body: Record<string, unknown> = {
      model: "gen4_turbo",
      ratio: "16:9",
      duration,
    };

    if (options.imageUrl) {
      body.promptImage = options.imageUrl;
      body.promptText = prompt;
    } else {
      body.promptText = prompt;
    }

    const res = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Runway createGeneration failed (${res.status}): ${text}`
      );
    }

    const data = await res.json();
    return { id: data.id };
  },

  async getGeneration(id: string): Promise<GenerationStatus> {
    const res = await fetch(`${RUNWAY_API_BASE}/tasks/${id}`, {
      headers: headers(),
    });

    if (!res.ok) {
      throw new Error(`Runway getGeneration failed (${res.status})`);
    }

    const data = await res.json();
    const stateMap: Record<string, GenerationStatus["state"]> = {
      PENDING: "pending",
      THROTTLED: "pending",
      RUNNING: "processing",
      SUCCEEDED: "completed",
      FAILED: "failed",
      CANCELLED: "failed",
    };

    return {
      id: data.id,
      state: stateMap[data.status] || "processing",
      videoUrl: data.output?.[0],
      error: data.failure,
    };
  },
};
