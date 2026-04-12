import { describe, it, expect, vi, beforeEach } from "vitest";

const mockJobCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    job: {
      create: (...args: unknown[]) => mockJobCreate(...args),
    },
  },
}));

const mockInngestSend = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    send: (...args: unknown[]) => mockInngestSend(...args),
  },
}));

import { POST } from "../route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockJobCreate.mockResolvedValue({
    id: "job-123",
    generations: [
      { id: "gen-1", provider: "LUMA" },
      { id: "gen-2", provider: "RUNWAY" },
      { id: "gen-3", provider: "VEO" },
      { id: "gen-4", provider: "KLING" },
      { id: "gen-5", provider: "MINIMAX" },
    ],
  });
});

describe("POST /api/jobs", () => {
  it("creates a job with 5 generations and returns 201", async () => {
    const res = await POST(
      makeRequest({
        prompt: "A beautiful bakery ad with fresh bread",
        duration: 10,
      })
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.jobId).toBe("job-123");

    // Verify job was created with all 5 providers
    expect(mockJobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          prompt: "A beautiful bakery ad with fresh bread",
          duration: 10,
          uploadedAssets: [],
          generations: {
            create: expect.arrayContaining([
              { provider: "LUMA" },
              { provider: "RUNWAY" },
              { provider: "VEO" },
              { provider: "KLING" },
              { provider: "MINIMAX" },
            ]),
          },
        }),
      })
    );
  });

  it("sends 5 Inngest events for fan-out", async () => {
    await POST(
      makeRequest({
        prompt: "A restaurant ad with delicious food",
        duration: 15,
      })
    );

    expect(mockInngestSend).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "video/generate.luma",
          data: { generationId: "gen-1" },
        }),
        expect.objectContaining({
          name: "video/generate.runway",
          data: { generationId: "gen-2" },
        }),
      ])
    );
  });

  it("accepts assets array", async () => {
    await POST(
      makeRequest({
        prompt: "Car dealership ad with showroom",
        duration: 30,
        assets: ["https://example.com/car.jpg"],
      })
    );

    expect(mockJobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          uploadedAssets: ["https://example.com/car.jpg"],
        }),
      })
    );
  });

  it("returns 400 for invalid prompt (too short)", async () => {
    const res = await POST(
      makeRequest({ prompt: "Short", duration: 10 })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
  });

  it("returns 400 for invalid duration", async () => {
    const res = await POST(
      makeRequest({
        prompt: "A valid prompt for testing",
        duration: 20,
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing prompt", async () => {
    const res = await POST(makeRequest({ duration: 10 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid JSON body");
  });
});
