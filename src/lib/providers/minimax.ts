import type {
  VideoProviderClient,
  GenerateOptions,
  GenerationResult,
  GenerationStatus,
} from "./types";
import { getApiKey } from "@/lib/api-keys";

const MINIMAX_API_BASE = "https://api.minimax.chat/v1";

async function resolveApiKey(): Promise<string> {
  const key = await getApiKey("MINIMAX");
  if (!key) {
    throw new Error(
      "MiniMax API key is not configured. Set it at /settings or via MINIMAX_API_KEY env."
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

export const minimaxProvider: VideoProviderClient = {
  name: "MiniMax",
  maxDurationPerCall: 6,
  supportsExtension: false,

  async createGeneration(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerationResult> {
    const body: Record<string, unknown> = {
      prompt,
      model: "T2V-01",
    };

    if (options.imageUrl) {
      body.first_frame_image = options.imageUrl;
      body.model = "I2V-01";
    }

    const res = await fetch(`${MINIMAX_API_BASE}/video_generation`, {
      method: "POST",
      headers: await headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `MiniMax createGeneration failed (${res.status}): ${text}`
      );
    }

    const data = await res.json();
    return { id: data.task_id };
  },

  async getGeneration(id: string): Promise<GenerationStatus> {
    const res = await fetch(
      `${MINIMAX_API_BASE}/query/video_generation?task_id=${id}`,
      { headers: await headers() }
    );

    if (!res.ok) {
      throw new Error(`MiniMax getGeneration failed (${res.status})`);
    }

    const data = await res.json();
    const stateMap: Record<string, GenerationStatus["state"]> = {
      Queueing: "pending",
      Processing: "processing",
      Success: "completed",
      Fail: "failed",
    };

    return {
      id,
      state: stateMap[data.status] || "processing",
      videoUrl: data.file_id
        ? `${MINIMAX_API_BASE}/files/retrieve?file_id=${data.file_id}`
        : undefined,
      error: data.base_resp?.status_msg,
    };
  },
};
