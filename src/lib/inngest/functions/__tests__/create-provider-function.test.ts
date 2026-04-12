import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VideoProviderClient } from "@/lib/providers/types";

// Mock dependencies
const mockGenerationFindUniqueOrThrow = vi.fn();
const mockGenerationUpdate = vi.fn();
const mockGenerationFindMany = vi.fn();
const mockJobUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    generation: {
      findUniqueOrThrow: (...args: unknown[]) =>
        mockGenerationFindUniqueOrThrow(...args),
      update: (...args: unknown[]) => mockGenerationUpdate(...args),
      findMany: (...args: unknown[]) => mockGenerationFindMany(...args),
    },
    job: {
      update: (...args: unknown[]) => mockJobUpdate(...args),
    },
  },
}));

vi.mock("@/lib/r2", () => ({
  uploadVideo: vi
    .fn()
    .mockResolvedValue("https://pub-test.r2.dev/videos/gen-1.mp4"),
}));

vi.mock("@/lib/providers/types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/providers/types")>();
  return {
    ...actual,
    pollUntilComplete: vi.fn(),
  };
});

let capturedHandler: Function;

vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    createFunction: vi.fn((_config: unknown, handler: Function) => {
      capturedHandler = handler;
      return { __handler: handler };
    }),
  },
}));

import { pollUntilComplete } from "@/lib/providers/types";
import { createProviderFunction } from "../create-provider-function";

const mockPoll = vi.mocked(pollUntilComplete);

function createMockProvider(
  overrides: Partial<VideoProviderClient> = {}
): VideoProviderClient {
  return {
    name: "TestProvider",
    maxDurationPerCall: 10,
    supportsExtension: false,
    createGeneration: vi.fn().mockResolvedValue({ id: "prov-gen-1" }),
    getGeneration: vi.fn(),
    ...overrides,
  };
}

const mockStep = {
  run: vi.fn((_name: string, fn: () => unknown) => fn()),
};

const mockJob = {
  id: "job-1",
  prompt: "A bakery ad with warm lighting",
  duration: 10,
  uploadedAssets: [],
  status: "PENDING",
};

const mockGeneration = {
  id: "gen-1",
  jobId: "job-1",
  provider: "LUMA",
  status: "PENDING",
  job: mockJob,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerationFindUniqueOrThrow.mockResolvedValue(mockGeneration);
  mockGenerationUpdate.mockResolvedValue({});
  mockJobUpdate.mockResolvedValue({});
  mockGenerationFindMany.mockResolvedValue([
    { ...mockGeneration, status: "COMPLETED" },
  ]);

  // Mock fetch for downloading video
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
  });
});

describe("createProviderFunction", () => {
  it("creates a function handler", () => {
    const provider = createMockProvider();
    createProviderFunction("TEST", provider);
    expect(capturedHandler).toBeDefined();
  });

  it("runs the happy path: create, poll, upload, complete", async () => {
    const provider = createMockProvider();
    mockPoll.mockResolvedValue({
      id: "prov-gen-1",
      state: "completed",
      videoUrl: "https://provider.com/video.mp4",
    });

    createProviderFunction("TEST", provider);
    const result = await capturedHandler({
      event: { data: { generationId: "gen-1" } },
      step: mockStep,
    });

    expect(result).toEqual({
      status: "completed",
      videoUrl: "https://pub-test.r2.dev/videos/gen-1.mp4",
    });

    // Verify generation was loaded
    expect(mockGenerationFindUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "gen-1" },
      include: { job: true },
    });

    // Verify provider was called
    expect(provider.createGeneration).toHaveBeenCalledWith(
      "A bakery ad with warm lighting",
      { duration: 10, imageUrl: undefined }
    );

    // Verify status was updated to COMPLETED
    expect(mockGenerationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "gen-1" },
        data: expect.objectContaining({ status: "COMPLETED" }),
      })
    );
  });

  it("passes uploaded image URL to provider", async () => {
    const provider = createMockProvider();
    mockPoll.mockResolvedValue({
      id: "prov-gen-1",
      state: "completed",
      videoUrl: "https://provider.com/video.mp4",
    });

    mockGenerationFindUniqueOrThrow.mockResolvedValue({
      ...mockGeneration,
      job: {
        ...mockJob,
        uploadedAssets: ["https://utfs.io/f/image-123.jpg"],
      },
    });

    createProviderFunction("TEST", provider);
    await capturedHandler({
      event: { data: { generationId: "gen-1" } },
      step: mockStep,
    });

    expect(provider.createGeneration).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        imageUrl: "https://utfs.io/f/image-123.jpg",
      })
    );
  });

  it("marks generation as FAILED when provider fails", async () => {
    const provider = createMockProvider();
    mockPoll.mockResolvedValue({
      id: "prov-gen-1",
      state: "failed",
      error: "Content policy violation",
    });

    mockGenerationFindMany.mockResolvedValue([
      { status: "FAILED" },
      { status: "PENDING" },
    ]);

    createProviderFunction("TEST", provider);
    const result = await capturedHandler({
      event: { data: { generationId: "gen-1" } },
      step: mockStep,
    });

    expect(result.status).toBe("failed");
    expect(mockGenerationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          errorMessage: "Content policy violation",
        }),
      })
    );
  });

  it("chains extensions for providers that support it", async () => {
    const extendMock = vi.fn().mockResolvedValue({ id: "prov-ext-1" });
    const provider = createMockProvider({
      supportsExtension: true,
      maxDurationPerCall: 5,
      extendGeneration: extendMock,
    });

    mockGenerationFindUniqueOrThrow.mockResolvedValue({
      ...mockGeneration,
      job: { ...mockJob, duration: 15 },
    });

    // Initial generation completes
    mockPoll
      .mockResolvedValueOnce({
        id: "prov-gen-1",
        state: "completed",
        videoUrl: "https://provider.com/v1.mp4",
      })
      // Extension 1
      .mockResolvedValueOnce({
        id: "prov-ext-1",
        state: "completed",
        videoUrl: "https://provider.com/v2.mp4",
      })
      // Extension 2
      .mockResolvedValueOnce({
        id: "prov-ext-1",
        state: "completed",
        videoUrl: "https://provider.com/v3.mp4",
      });

    createProviderFunction("TEST", provider);
    await capturedHandler({
      event: { data: { generationId: "gen-1" } },
      step: mockStep,
    });

    // 15s / 5s per call = 3 calls, so 2 extensions
    expect(extendMock).toHaveBeenCalledTimes(2);
    expect(mockGenerationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "EXTENDING" }),
      })
    );
  });

  it("does not extend for providers without extension support", async () => {
    const provider = createMockProvider({
      supportsExtension: false,
      maxDurationPerCall: 10,
    });

    mockGenerationFindUniqueOrThrow.mockResolvedValue({
      ...mockGeneration,
      job: { ...mockJob, duration: 30 },
    });

    mockPoll.mockResolvedValue({
      id: "prov-gen-1",
      state: "completed",
      videoUrl: "https://provider.com/video.mp4",
    });

    createProviderFunction("TEST", provider);
    await capturedHandler({
      event: { data: { generationId: "gen-1" } },
      step: mockStep,
    });

    // Should still complete, just with shorter video
    expect(mockGenerationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "COMPLETED" }),
      })
    );
  });
});
