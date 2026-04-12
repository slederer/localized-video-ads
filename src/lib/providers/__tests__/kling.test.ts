import { describe, it, expect, vi, beforeEach } from "vitest";
import { klingProvider } from "../kling";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.resetAllMocks();
  process.env.KLING_API_KEY = "test-kling-key";
});

describe("klingProvider", () => {
  it("has correct metadata", () => {
    expect(klingProvider.name).toBe("Kling");
    expect(klingProvider.maxDurationPerCall).toBe(10);
    expect(klingProvider.supportsExtension).toBe(false);
  });

  describe("createGeneration", () => {
    it("creates text-to-video generation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { task_id: "task-kling-1" } }),
      });

      const result = await klingProvider.createGeneration("A flower shop ad", {
        duration: 10,
      });

      expect(result.id).toBe("task-kling-1");
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("text2video");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.prompt).toBe("A flower shop ad");
      expect(body.model_name).toBe("kling-v2");
      expect(body.image_url).toBeUndefined();
    });

    it("uses image2video endpoint when image provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { task_id: "task-kling-2" } }),
      });

      await klingProvider.createGeneration("Flower shop", {
        duration: 10,
        imageUrl: "https://example.com/flowers.jpg",
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("image2video");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.image_url).toBe("https://example.com/flowers.jpg");
    });
  });

  describe("getGeneration", () => {
    it("maps succeed to completed with video URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              task_status: "succeed",
              task_result: {
                videos: [{ url: "https://kling.ai/video.mp4" }],
              },
            },
          }),
      });

      const status = await klingProvider.getGeneration("task-kling-1");
      expect(status.state).toBe("completed");
      expect(status.videoUrl).toBe("https://kling.ai/video.mp4");
    });

    it("maps processing to processing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ data: { task_status: "processing" } }),
      });

      const status = await klingProvider.getGeneration("task-kling-1");
      expect(status.state).toBe("processing");
    });

    it("maps failed with error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              task_status: "failed",
              task_status_msg: "Quota exceeded",
            },
          }),
      });

      const status = await klingProvider.getGeneration("task-kling-1");
      expect(status.state).toBe("failed");
      expect(status.error).toBe("Quota exceeded");
    });
  });
});
