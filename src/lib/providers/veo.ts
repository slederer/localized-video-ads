import type {
  VideoProviderClient,
  GenerateOptions,
  GenerationResult,
  GenerationStatus,
} from "./types";

function getProjectId(): string {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) throw new Error("GOOGLE_CLOUD_PROJECT is not set");
  return project;
}

function getAccessToken(): string {
  const token = process.env.GOOGLE_ACCESS_TOKEN;
  if (!token)
    throw new Error(
      "GOOGLE_ACCESS_TOKEN is not set. Run: gcloud auth print-access-token"
    );
  return token;
}

function getApiBase(): string {
  const project = getProjectId();
  return `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models`;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
  };
}

export const veoProvider: VideoProviderClient = {
  name: "Veo",
  maxDurationPerCall: 8,
  supportsExtension: true,

  async createGeneration(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerationResult> {
    const body: Record<string, unknown> = {
      instances: [
        {
          prompt,
          ...(options.imageUrl ? { image: { gcsUri: options.imageUrl } } : {}),
        },
      ],
      parameters: {
        videoLength: 8,
        resolution: "720p",
      },
    };

    const res = await fetch(
      `${getApiBase()}/veo-3.0-generate-preview:predictLongRunning`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Veo createGeneration failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return { id: data.name };
  },

  async getGeneration(id: string): Promise<GenerationStatus> {
    const res = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/${id}`,
      { headers: headers() }
    );

    if (!res.ok) {
      throw new Error(`Veo getGeneration failed (${res.status})`);
    }

    const data = await res.json();

    if (data.done && data.response) {
      const videoUri =
        data.response.predictions?.[0]?.videoUri ||
        data.response.predictions?.[0]?.gcsUri;
      return {
        id,
        state: "completed",
        videoUrl: videoUri,
      };
    }

    if (data.done && data.error) {
      return {
        id,
        state: "failed",
        error: data.error.message,
      };
    }

    return { id, state: "processing" };
  },

  async extendGeneration(
    generationId: string,
    prompt: string
  ): Promise<GenerationResult> {
    const body = {
      instances: [
        {
          prompt,
          lastFrame: { previousGenerationId: generationId },
        },
      ],
      parameters: {
        videoLength: 8,
        resolution: "720p",
      },
    };

    const res = await fetch(
      `${getApiBase()}/veo-3.0-generate-preview:predictLongRunning`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Veo extendGeneration failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return { id: data.name };
  },
};
