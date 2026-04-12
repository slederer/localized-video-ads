import { describe, it, expect, vi, beforeEach } from "vitest";
import { veoProvider } from "../veo";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.resetAllMocks();
  process.env.GOOGLE_CLOUD_PROJECT = "test-project";
  process.env.GOOGLE_ACCESS_TOKEN = "test-token";
});

describe("veoProvider", () => {
  it("has correct metadata", () => {
    expect(veoProvider.name).toBe("Veo");
    expect(veoProvider.maxDurationPerCall).toBe(8);
    expect(veoProvider.supportsExtension).toBe(true);
  });

  describe("createGeneration", () => {
    it("creates text-to-video generation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ name: "projects/test-project/operations/op-123" }),
      });

      const result = await veoProvider.createGeneration("A restaurant ad", {
        duration: 10,
      });

      expect(result.id).toBe("projects/test-project/operations/op-123");
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("test-project");
      expect(url).toContain("veo-3.0-generate-preview:predictLongRunning");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.instances[0].prompt).toBe("A restaurant ad");
      expect(body.parameters.videoLength).toBe(8);
    });

    it("includes image URL when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ name: "operations/op-456" }),
      });

      await veoProvider.createGeneration("ad with image", {
        duration: 10,
        imageUrl: "gs://bucket/image.jpg",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.instances[0].image.gcsUri).toBe("gs://bucket/image.jpg");
    });
  });

  describe("getGeneration", () => {
    it("maps completed operation with video URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            done: true,
            response: {
              predictions: [{ videoUri: "gs://bucket/video.mp4" }],
            },
          }),
      });

      const status = await veoProvider.getGeneration("operations/op-123");
      expect(status.state).toBe("completed");
      expect(status.videoUrl).toBe("gs://bucket/video.mp4");
    });

    it("maps in-progress operation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ done: false }),
      });

      const status = await veoProvider.getGeneration("operations/op-123");
      expect(status.state).toBe("processing");
    });

    it("maps failed operation with error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            done: true,
            error: { message: "Content policy violation" },
          }),
      });

      const status = await veoProvider.getGeneration("operations/op-123");
      expect(status.state).toBe("failed");
      expect(status.error).toBe("Content policy violation");
    });
  });

  describe("extendGeneration", () => {
    it("extends with previous generation reference", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ name: "operations/op-789" }),
      });

      const result = await veoProvider.extendGeneration!(
        "operations/op-123",
        "Continue the scene"
      );

      expect(result.id).toBe("operations/op-789");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.instances[0].lastFrame.previousGenerationId).toBe(
        "operations/op-123"
      );
    });
  });
});
