import { describe, it, expect, vi, beforeEach } from "vitest";
import { minimaxProvider } from "../minimax";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.resetAllMocks();
  process.env.MINIMAX_API_KEY = "test-minimax-key";
});

describe("minimaxProvider", () => {
  it("has correct metadata", () => {
    expect(minimaxProvider.name).toBe("MiniMax");
    expect(minimaxProvider.maxDurationPerCall).toBe(6);
    expect(minimaxProvider.supportsExtension).toBe(false);
  });

  describe("createGeneration", () => {
    it("creates text-to-video generation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ task_id: "mm-task-1" }),
      });

      const result = await minimaxProvider.createGeneration("A pizza ad", {
        duration: 10,
      });

      expect(result.id).toBe("mm-task-1");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.prompt).toBe("A pizza ad");
      expect(body.model).toBe("T2V-01");
      expect(body.first_frame_image).toBeUndefined();
    });

    it("uses I2V model when image provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ task_id: "mm-task-2" }),
      });

      await minimaxProvider.createGeneration("Pizza ad", {
        duration: 10,
        imageUrl: "https://example.com/pizza.jpg",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("I2V-01");
      expect(body.first_frame_image).toBe("https://example.com/pizza.jpg");
    });
  });

  describe("getGeneration", () => {
    it("maps Success to completed with video URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "Success",
            file_id: "file-123",
          }),
      });

      const status = await minimaxProvider.getGeneration("mm-task-1");
      expect(status.state).toBe("completed");
      expect(status.videoUrl).toContain("file-123");
    });

    it("maps Processing to processing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: "Processing" }),
      });

      const status = await minimaxProvider.getGeneration("mm-task-1");
      expect(status.state).toBe("processing");
    });

    it("maps Fail with error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "Fail",
            base_resp: { status_msg: "Server error" },
          }),
      });

      const status = await minimaxProvider.getGeneration("mm-task-1");
      expect(status.state).toBe("failed");
      expect(status.error).toBe("Server error");
    });
  });
});
