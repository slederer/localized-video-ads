import { describe, it, expect, vi, beforeEach } from "vitest";

const mockJobFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    job: {
      findUnique: (...args: unknown[]) => mockJobFindUnique(...args),
    },
  },
}));

import { GET } from "../route";

function makeRequest(jobId: string) {
  return new Request(`http://localhost/api/jobs/${jobId}`);
}

function makeParams(jobId: string) {
  return { params: Promise.resolve({ jobId }) };
}

const mockJob = {
  id: "job-123",
  status: "PROCESSING",
  prompt: "A bakery ad",
  duration: 10,
  uploadedAssets: [],
  createdAt: new Date("2026-04-11"),
  generations: [
    {
      id: "gen-1",
      provider: "LUMA",
      status: "COMPLETED",
      videoUrl: "https://r2.dev/videos/gen-1.mp4",
      errorMessage: null,
      updatedAt: new Date("2026-04-11"),
    },
    {
      id: "gen-2",
      provider: "RUNWAY",
      status: "GENERATING",
      videoUrl: null,
      errorMessage: null,
      updatedAt: new Date("2026-04-11"),
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/jobs/[jobId]", () => {
  it("returns job with all generations", async () => {
    mockJobFindUnique.mockResolvedValue(mockJob);

    const res = await GET(makeRequest("job-123"), makeParams("job-123"));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe("job-123");
    expect(data.status).toBe("PROCESSING");
    expect(data.generations).toHaveLength(2);
    expect(data.generations[0].provider).toBe("LUMA");
    expect(data.generations[0].videoUrl).toBe(
      "https://r2.dev/videos/gen-1.mp4"
    );
    expect(data.generations[1].provider).toBe("RUNWAY");
    expect(data.generations[1].status).toBe("GENERATING");
  });

  it("returns 404 for unknown job", async () => {
    mockJobFindUnique.mockResolvedValue(null);

    const res = await GET(
      makeRequest("nonexistent"),
      makeParams("nonexistent")
    );
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Job not found");
  });

  it("queries with correct jobId and includes generations", async () => {
    mockJobFindUnique.mockResolvedValue(mockJob);

    await GET(makeRequest("job-456"), makeParams("job-456"));

    expect(mockJobFindUnique).toHaveBeenCalledWith({
      where: { id: "job-456" },
      include: {
        generations: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });
  });
});
