import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-keys", () => ({
  getApiKey: vi.fn(async () => "test-seedance-key"),
}));

import { seedanceProvider } from "../seedance";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("seedanceProvider", () => {
  it("has correct metadata", () => {
    expect(seedanceProvider.name).toBe("Seedance");
    expect(seedanceProvider.maxDurationPerCall).toBe(12);
    expect(seedanceProvider.supportsExtension).toBe(false);
  });

  describe("createGeneration", () => {
    it("creates a text-to-video task", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "sd-task-1" }),
      });

      const result = await seedanceProvider.createGeneration("A pizza ad", {
        duration: 10,
      });

      expect(result.id).toBe("sd-task-1");
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("/contents/generations/tasks");
      const req = mockFetch.mock.calls[0][1];
      expect(req.headers.Authorization).toBe("Bearer test-seedance-key");
      const body = JSON.parse(req.body);
      expect(body.model).toBe("dreamina-seedance-2-0-260128");
      expect(body.content).toEqual([{ type: "text", text: "A pizza ad" }]);
      expect(body.duration).toBe(10);
    });

    it("adds a first_frame image part when imageUrl provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "sd-task-2" }),
      });

      await seedanceProvider.createGeneration("Pizza ad", {
        duration: 10,
        imageUrl: "https://example.com/pizza.jpg",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.content).toContainEqual({
        type: "image_url",
        image_url: { url: "https://example.com/pizza.jpg" },
        role: "first_frame",
      });
    });

    it("throws with status and body on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("unauthorized"),
      });

      await expect(
        seedanceProvider.createGeneration("ad", { duration: 10 })
      ).rejects.toThrow(/Seedance createGeneration failed \(401\): unauthorized/);
    });
  });

  describe("getGeneration", () => {
    it("maps succeeded to completed with video URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "succeeded",
            content: { video_url: "https://ark.example/out.mp4" },
          }),
      });

      const status = await seedanceProvider.getGeneration("sd-task-1");
      expect(status.state).toBe("completed");
      expect(status.videoUrl).toBe("https://ark.example/out.mp4");
    });

    it("maps running to processing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: "running" }),
      });

      const status = await seedanceProvider.getGeneration("sd-task-1");
      expect(status.state).toBe("processing");
    });

    it("maps failed with error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "failed",
            error: { message: "content policy violation" },
          }),
      });

      const status = await seedanceProvider.getGeneration("sd-task-1");
      expect(status.state).toBe("failed");
      expect(status.error).toBe("content policy violation");
    });

    it("treats expired and cancelled as failed", async () => {
      for (const s of ["expired", "cancelled"]) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: s }),
        });
        const status = await seedanceProvider.getGeneration("sd-task-1");
        expect(status.state).toBe("failed");
      }
    });
  });
});
