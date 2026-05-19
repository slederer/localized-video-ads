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

describe("lumaProvider (Luma Agents API, uni-1)", () => {
  it("has correct metadata", () => {
    expect(lumaProvider.name).toBe("Luma");
    expect(lumaProvider.maxDurationPerCall).toBe(8);
    expect(lumaProvider.supportsExtension).toBe(false);
  });

  describe("createGeneration", () => {
    it("posts to the Agents API with type=video and uni-1", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "luma-gen-1" }),
      });

      const result = await lumaProvider.createGeneration("A pizza ad", {
        duration: 8,
      });
      expect(result.id).toBe("luma-gen-1");

      const [url, req] = mockFetch.mock.calls[0];
      expect(url).toBe("https://agents.lumalabs.ai/v1/generations");
      expect(req.method).toBe("POST");
      expect((req.headers as Record<string, string>).Authorization).toBe(
        "Bearer test-luma-key"
      );
      const body = JSON.parse(req.body);
      expect(body.model).toBe("uni-1");
      expect(body.type).toBe("video");
      expect(body.prompt).toBe("A pizza ad");
      expect(body.aspect_ratio).toBe("16:9");
      expect(body.duration).toBe(8);
      expect(body.source).toBeUndefined();
    });

    it("clamps duration to maxDurationPerCall", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "luma-gen-2" }),
      });
      await lumaProvider.createGeneration("x", { duration: 30 });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.duration).toBe(8);
    });

    it("includes source.url when imageUrl is provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "luma-gen-3" }),
      });
      await lumaProvider.createGeneration("ad", {
        duration: 5,
        imageUrl: "https://example.com/frame.jpg",
      });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.source).toEqual({ url: "https://example.com/frame.jpg" });
    });

    it("throws with status and body on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Invalid API key"),
      });
      await expect(
        lumaProvider.createGeneration("x", { duration: 5 })
      ).rejects.toThrow(/Luma createGeneration failed \(401\): Invalid API key/);
    });
  });

  describe("getGeneration", () => {
    it("maps completed and picks the video output URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "luma-gen-1",
            state: "completed",
            output: [
              { type: "video", url: "https://luma.example/out.mp4" },
            ],
          }),
      });
      const s = await lumaProvider.getGeneration("luma-gen-1");
      expect(s.state).toBe("completed");
      expect(s.videoUrl).toBe("https://luma.example/out.mp4");
    });

    it("maps queued to pending and running to processing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "x", state: "queued", output: [] }),
      });
      expect((await lumaProvider.getGeneration("x")).state).toBe("pending");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "x", state: "running", output: [] }),
      });
      expect((await lumaProvider.getGeneration("x")).state).toBe("processing");
    });

    it("maps failed with failure_reason", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "x",
            state: "failed",
            output: [],
            failure_reason: "content policy",
          }),
      });
      const s = await lumaProvider.getGeneration("x");
      expect(s.state).toBe("failed");
      expect(s.error).toBe("content policy");
    });
  });
});
