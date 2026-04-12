export interface GenerationResult {
  id: string;
}

export interface GenerationStatus {
  id: string;
  state: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export interface GenerateOptions {
  imageUrl?: string;
  duration: number;
}

export interface VideoProviderClient {
  readonly name: string;
  readonly maxDurationPerCall: number;
  readonly supportsExtension: boolean;

  createGeneration(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerationResult>;

  getGeneration(id: string): Promise<GenerationStatus>;

  extendGeneration?(
    generationId: string,
    prompt: string
  ): Promise<GenerationResult>;
}

export async function pollUntilComplete(
  provider: VideoProviderClient,
  generationId: string,
  opts: { maxAttempts?: number; intervalMs?: number } = {}
): Promise<GenerationStatus> {
  const { maxAttempts = 60, intervalMs = 10000 } = opts;

  for (let i = 0; i < maxAttempts; i++) {
    const status = await provider.getGeneration(generationId);
    if (status.state === "completed" || status.state === "failed") {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    id: generationId,
    state: "failed",
    error: "Generation timed out",
  };
}
