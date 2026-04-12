import { describe, it, expect, vi } from "vitest";
import { pollUntilComplete } from "../types";
import type { VideoProviderClient, GenerationStatus } from "../types";

describe("pollUntilComplete", () => {
  function createMockProvider(
    responses: GenerationStatus[]
  ): VideoProviderClient {
    let callIndex = 0;
    return {
      name: "MockProvider",
      maxDurationPerCall: 10,
      supportsExtension: false,
      createGeneration: vi.fn(),
      getGeneration: vi.fn(async () => responses[callIndex++]),
    };
  }

  it("returns immediately when generation is already completed", async () => {
    const provider = createMockProvider([
      { id: "gen-1", state: "completed", videoUrl: "https://example.com/v.mp4" },
    ]);

    const result = await pollUntilComplete(provider, "gen-1", {
      intervalMs: 1,
    });

    expect(result.state).toBe("completed");
    expect(result.videoUrl).toBe("https://example.com/v.mp4");
    expect(provider.getGeneration).toHaveBeenCalledTimes(1);
  });

  it("polls until completion", async () => {
    const provider = createMockProvider([
      { id: "gen-1", state: "pending" },
      { id: "gen-1", state: "processing" },
      { id: "gen-1", state: "completed", videoUrl: "https://example.com/v.mp4" },
    ]);

    const result = await pollUntilComplete(provider, "gen-1", {
      intervalMs: 1,
    });

    expect(result.state).toBe("completed");
    expect(provider.getGeneration).toHaveBeenCalledTimes(3);
  });

  it("returns failed status when generation fails", async () => {
    const provider = createMockProvider([
      { id: "gen-1", state: "processing" },
      { id: "gen-1", state: "failed", error: "Content violation" },
    ]);

    const result = await pollUntilComplete(provider, "gen-1", {
      intervalMs: 1,
    });

    expect(result.state).toBe("failed");
    expect(result.error).toBe("Content violation");
  });

  it("times out after max attempts", async () => {
    const provider = createMockProvider([
      { id: "gen-1", state: "processing" },
      { id: "gen-1", state: "processing" },
      { id: "gen-1", state: "processing" },
    ]);

    const result = await pollUntilComplete(provider, "gen-1", {
      maxAttempts: 3,
      intervalMs: 1,
    });

    expect(result.state).toBe("failed");
    expect(result.error).toBe("Generation timed out");
  });
});
