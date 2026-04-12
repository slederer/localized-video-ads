import type {
  VideoProviderClient,
  GenerateOptions,
  GenerationResult,
  GenerationStatus,
} from "./types";

const KLING_API_BASE = "https://api.klingai.com/v1/videos";

function getApiKey(): string {
  const key = process.env.KLING_API_KEY;
  if (!key) throw new Error("KLING_API_KEY is not set");
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

export const klingProvider: VideoProviderClient = {
  name: "Kling",
  maxDurationPerCall: 10,
  supportsExtension: false,

  async createGeneration(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerationResult> {
    const endpoint = options.imageUrl
      ? `${KLING_API_BASE}/image2video`
      : `${KLING_API_BASE}/text2video`;

    const body: Record<string, unknown> = {
      prompt,
      model_name: "kling-v2",
      duration: "10",
      aspect_ratio: "16:9",
    };

    if (options.imageUrl) {
      body.image_url = options.imageUrl;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Kling createGeneration failed (${res.status}): ${text}`
      );
    }

    const data = await res.json();
    return { id: data.data.task_id };
  },

  async getGeneration(id: string): Promise<GenerationStatus> {
    const res = await fetch(`${KLING_API_BASE}/text2video/${id}`, {
      headers: headers(),
    });

    if (!res.ok) {
      throw new Error(`Kling getGeneration failed (${res.status})`);
    }

    const data = await res.json();
    const task = data.data;
    const stateMap: Record<string, GenerationStatus["state"]> = {
      submitted: "pending",
      processing: "processing",
      succeed: "completed",
      failed: "failed",
    };

    return {
      id,
      state: stateMap[task.task_status] || "processing",
      videoUrl: task.task_result?.videos?.[0]?.url,
      error: task.task_status_msg,
    };
  },
};
