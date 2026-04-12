import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn().mockResolvedValue({});

vi.mock("@aws-sdk/client-s3", () => {
  class MockS3Client {
    send = sendMock;
  }
  class MockPutObjectCommand {
    constructor(public params: Record<string, unknown>) {}
  }
  return {
    S3Client: MockS3Client,
    PutObjectCommand: MockPutObjectCommand,
  };
});

beforeEach(async () => {
  vi.resetModules();
  sendMock.mockClear();
  process.env.R2_ACCOUNT_ID = "test-account";
  process.env.R2_ACCESS_KEY_ID = "test-key-id";
  process.env.R2_SECRET_ACCESS_KEY = "test-secret";
  process.env.R2_BUCKET_NAME = "test-bucket";
  process.env.R2_PUBLIC_URL = "https://pub-test.r2.dev";
});

describe("r2", () => {
  describe("getPublicUrl", () => {
    it("constructs correct URL from key", async () => {
      const { getPublicUrl } = await import("../r2");
      const url = getPublicUrl("videos/test-123.mp4");
      expect(url).toBe("https://pub-test.r2.dev/videos/test-123.mp4");
    });

    it("handles trailing slash in public URL", async () => {
      process.env.R2_PUBLIC_URL = "https://pub-test.r2.dev/";
      const { getPublicUrl } = await import("../r2");
      const url = getPublicUrl("videos/test.mp4");
      expect(url).toBe("https://pub-test.r2.dev/videos/test.mp4");
    });
  });

  describe("uploadVideo", () => {
    it("uploads buffer and returns public URL", async () => {
      const { uploadVideo } = await import("../r2");
      const buffer = Buffer.from("fake-video-data");
      const url = await uploadVideo("videos/job-1.mp4", buffer, "video/mp4");

      expect(url).toBe("https://pub-test.r2.dev/videos/job-1.mp4");
      expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it("sends correct S3 params", async () => {
      const { uploadVideo } = await import("../r2");
      const buffer = Buffer.from("data");

      await uploadVideo("key.mp4", buffer, "video/mp4");

      const sentCommand = sendMock.mock.calls[0][0];
      expect(sentCommand.params.Bucket).toBe("test-bucket");
      expect(sentCommand.params.Key).toBe("key.mp4");
      expect(sentCommand.params.ContentType).toBe("video/mp4");
    });
  });

  describe("config validation", () => {
    it("throws when R2 env vars are missing", async () => {
      delete process.env.R2_ACCOUNT_ID;
      const { getPublicUrl } = await import("../r2");
      expect(() => getPublicUrl("test")).toThrow(
        "R2 environment variables are not fully configured"
      );
    });
  });
});
