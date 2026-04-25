import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-keys", () => ({
  getApiKey: vi.fn(async () => "test-runway-key"),
}));

import { runwayProvider } from "../runway";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("runwayProvider", () => {
  it("has correct metadata", () => {
    expect(runwayProvider.name).toBe("Runway");
    expect(runwayProvider.maxDurationPerCall).toBe(10);
    expect(runwayProvider.supportsExtension).toBe(false);
  });

  describe("createGeneration", () => {
    it("creates text-to-video generation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "task-abc" }),
      });

      const result = await runwayProvider.createGeneration(
        "A car dealership ad",
        { duration: 10 }
      );

      expect(result.id).toBe("task-abc");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("gen4_turbo");
      expect(body.promptText).toBe("A car dealership ad");
      expect(body.duration).toBe(10);
      expect(body.ratio).toBe("16:9");
    });

    it("includes image when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "task-def" }),
      });

      await runwayProvider.createGeneration("Car ad", {
        duration: 10,
        imageUrl: "https://example.com/car.jpg",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.promptImage).toBe("https://example.com/car.jpg");
      expect(body.promptText).toBe("Car ad");
    });

    it("caps duration at 10s", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "task-xyz" }),
      });

      await runwayProvider.createGeneration("test", { duration: 30 });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.duration).toBe(10);
    });
  });

  describe("getGeneration", () => {
    it("maps SUCCEEDED to completed with video URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "task-abc",
            status: "SUCCEEDED",
            output: ["https://runway.com/video.mp4"],
          }),
      });

      const status = await runwayProvider.getGeneration("task-abc");
      expect(status.state).toBe("completed");
      expect(status.videoUrl).toBe("https://runway.com/video.mp4");
    });

    it("maps RUNNING to processing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "task-abc", status: "RUNNING" }),
      });

      const status = await runwayProvider.getGeneration("task-abc");
      expect(status.state).toBe("processing");
    });

    it("maps FAILED with error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "task-abc",
            status: "FAILED",
            failure: "Rate limited",
          }),
      });

      const status = await runwayProvider.getGeneration("task-abc");
      expect(status.state).toBe("failed");
      expect(status.error).toBe("Rate limited");
    });
  });
});
