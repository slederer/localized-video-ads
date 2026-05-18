import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-keys", () => ({
  getApiKey: vi.fn(async () => "test-luma-key"),
}));

import { lumaProvider } from "../luma";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("lumaProvider", () => {
  it("has correct metadata", () => {
    expect(lumaProvider.name).toBe("Luma");
    expect(lumaProvider.maxDurationPerCall).toBe(5);
    expect(lumaProvider.supportsExtension).toBe(true);
  });

  describe("createGeneration", () => {
    it("creates text-to-video generation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "gen-123" }),
      });

      const result = await lumaProvider.createGeneration("A cozy bakery ad", {
        duration: 10,
      });

      expect(result.id).toBe("gen-123");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.lumalabs.ai/dream-machine/v1/generations",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"prompt":"A cozy bakery ad"'),
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("ray-flash-2");
      expect(body.duration).toBe("5s");
      expect(body.keyframes).toBeUndefined();
    });

    it("creates image-to-video generation with keyframe", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "gen-456" }),
      });

      await lumaProvider.createGeneration("A bakery storefront", {
        duration: 10,
        imageUrl: "https://example.com/bakery.jpg",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.keyframes).toEqual({
        frame0: { type: "image", url: "https://example.com/bakery.jpg" },
      });
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad request"),
      });

      await expect(
        lumaProvider.createGeneration("test", { duration: 10 })
      ).rejects.toThrow("Luma createGeneration failed (400)");
    });
  });

  describe("getGeneration", () => {
    it("maps completed state with video URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "gen-123",
            state: "completed",
            assets: { video: "https://luma.ai/video.mp4" },
          }),
      });

      const status = await lumaProvider.getGeneration("gen-123");
      expect(status.state).toBe("completed");
      expect(status.videoUrl).toBe("https://luma.ai/video.mp4");
    });

    it("maps dreaming state to processing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "gen-123", state: "dreaming" }),
      });

      const status = await lumaProvider.getGeneration("gen-123");
      expect(status.state).toBe("processing");
    });

    it("maps failed state with error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "gen-123",
            state: "failed",
            failure_reason: "Content policy violation",
          }),
      });

      const status = await lumaProvider.getGeneration("gen-123");
      expect(status.state).toBe("failed");
      expect(status.error).toBe("Content policy violation");
    });
  });

  describe("extendGeneration", () => {
    it("extends with previous generation as keyframe", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "gen-789" }),
      });

      const result = await lumaProvider.extendGeneration!(
        "gen-123",
        "Continue the bakery scene"
      );

      expect(result.id).toBe("gen-789");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.keyframes).toEqual({
        frame0: { type: "generation", id: "gen-123" },
      });
    });
  });
});
