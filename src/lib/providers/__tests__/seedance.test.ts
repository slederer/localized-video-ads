import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { seedanceProvider } from "../seedance";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const ORIG = { ...process.env };

beforeEach(() => {
  mockFetch.mockReset();
  process.env.SEEDANCE_ACCESS_KEY = "AKAtestaccess";
  process.env.SEEDANCE_SECRET_KEY = "testsecretkey";
  delete process.env.SEEDANCE_ENDPOINT_ID;
  delete process.env.SEEDANCE_REGION;
  delete process.env.SEEDANCE_SERVICE;
});

afterEach(() => {
  process.env = { ...ORIG };
});

describe("seedanceProvider (Volcano AK/SK signing)", () => {
  it("has correct metadata", () => {
    expect(seedanceProvider.name).toBe("Seedance");
    expect(seedanceProvider.maxDurationPerCall).toBe(12);
    expect(seedanceProvider.supportsExtension).toBe(false);
  });

  it("throws if AK/SK env vars are missing", async () => {
    delete process.env.SEEDANCE_ACCESS_KEY;
    await expect(
      seedanceProvider.createGeneration("ad", { duration: 10 })
    ).rejects.toThrow(/SEEDANCE_ACCESS_KEY and SEEDANCE_SECRET_KEY/);
  });

  describe("createGeneration", () => {
    it("signs the request with a valid Volcano V4 Authorization header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "sd-task-1" }),
      });

      const result = await seedanceProvider.createGeneration("A pizza ad", {
        duration: 10,
      });
      expect(result.id).toBe("sd-task-1");

      const [url, req] = mockFetch.mock.calls[0];
      expect(url).toContain("/contents/generations/tasks");
      const h = req.headers as Record<string, string>;

      expect(h.Host).toBe("ark.ap-southeast.bytepluses.com");
      expect(h["X-Date"]).toMatch(/^\d{8}T\d{6}Z$/);
      expect(h["X-Content-Sha256"]).toMatch(/^[a-f0-9]{64}$/);
      expect(h.Authorization).toMatch(
        /^HMAC-SHA256 Credential=AKAtestaccess\/\d{8}\/ap-southeast\/ark\/request, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=[a-f0-9]{64}$/
      );

      const body = JSON.parse(req.body);
      expect(body.model).toBe("dreamina-seedance-2-0-260128");
      expect(body.content).toEqual([{ type: "text", text: "A pizza ad" }]);
      expect(body.duration).toBe(10);
    });

    it("uses the Endpoint ID as model when SEEDANCE_ENDPOINT_ID is set", async () => {
      process.env.SEEDANCE_ENDPOINT_ID = "ep-20260518-abcde";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "sd-task-2" }),
      });

      await seedanceProvider.createGeneration("Pizza ad", {
        duration: 10,
        imageUrl: "https://example.com/pizza.jpg",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("ep-20260518-abcde");
      expect(body.content).toContainEqual({
        type: "image_url",
        image_url: { url: "https://example.com/pizza.jpg" },
        role: "first_frame",
      });
    });

    it("honors SEEDANCE_REGION / SEEDANCE_SERVICE overrides in the scope", async () => {
      process.env.SEEDANCE_REGION = "cn-north-1";
      process.env.SEEDANCE_SERVICE = "cv";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "sd-task-3" }),
      });

      await seedanceProvider.createGeneration("ad", { duration: 10 });

      const h = mockFetch.mock.calls[0][1].headers as Record<string, string>;
      expect(h.Authorization).toContain("/cn-north-1/cv/request,");
    });

    it("throws with status and body on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve("signature mismatch"),
      });

      await expect(
        seedanceProvider.createGeneration("ad", { duration: 10 })
      ).rejects.toThrow(/Seedance createGeneration failed \(403\): signature mismatch/);
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
      expect((await seedanceProvider.getGeneration("x")).state).toBe(
        "processing"
      );
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
      const s = await seedanceProvider.getGeneration("x");
      expect(s.state).toBe("failed");
      expect(s.error).toBe("content policy violation");
    });

    it("treats expired and cancelled as failed", async () => {
      for (const st of ["expired", "cancelled"]) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: st }),
        });
        expect((await seedanceProvider.getGeneration("x")).state).toBe(
          "failed"
        );
      }
    });
  });
});
