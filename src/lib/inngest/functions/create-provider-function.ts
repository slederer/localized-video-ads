import { inngest } from "../client";
import { db } from "@/lib/db";
import { uploadVideo } from "@/lib/r2";
import type { VideoProviderClient } from "@/lib/providers/types";
import { pollUntilComplete } from "@/lib/providers/types";

export function createProviderFunction(
  providerKey: string,
  provider: VideoProviderClient
) {
  return inngest.createFunction(
    {
      id: `generate-${providerKey.toLowerCase()}`,
      retries: 2,
      triggers: [{ event: `video/generate.${providerKey.toLowerCase()}` }],
      // When the function exhausts retries (e.g. provider auth error),
      // record the failure so the generation doesn't hang on GENERATING.
      onFailure: async ({ event, error }) => {
        const generationId = (
          event.data.event.data as { generationId: string }
        ).generationId;
        const message = String(error?.message || error).slice(0, 500);
        try {
          const gen = await db.generation.update({
            where: { id: generationId },
            data: { status: "FAILED", errorMessage: message },
          });
          await updateJobStatus(gen.jobId);
        } catch (err) {
          console.error(
            `[${providerKey}] onFailure could not mark generation ${generationId} failed:`,
            err
          );
        }
      },
    },
    async ({ event, step }) => {
      const { generationId } = event.data as { generationId: string };

      const generation = await step.run("load-generation", async () => {
        return db.generation.findUniqueOrThrow({
          where: { id: generationId },
          include: { job: true },
        });
      });

      const { job } = generation;

      // Step 1: Create initial generation
      const initial = await step.run("create-generation", async () => {
        await db.generation.update({
          where: { id: generationId },
          data: { status: "GENERATING" },
        });

        // Also update job status to PROCESSING
        await db.job.update({
          where: { id: job.id },
          data: { status: "PROCESSING" },
        });

        return provider.createGeneration(job.prompt, {
          duration: job.duration,
          imageUrl: job.uploadedAssets[0],
        });
      });

      // Step 2: Poll for initial generation
      const completed = await step.run("poll-initial", async () => {
        return pollUntilComplete(provider, initial.id, {
          maxAttempts: 60,
          intervalMs: 10000,
        });
      });

      if (completed.state === "failed") {
        await step.run("mark-failed", async () => {
          await db.generation.update({
            where: { id: generationId },
            data: {
              status: "FAILED",
              errorMessage: completed.error || "Generation failed",
              providerIds: [initial.id],
            },
          });
          await updateJobStatus(job.id);
        });
        return { status: "failed", error: completed.error };
      }

      // Step 3: Extend if needed and provider supports it
      let currentVideoUrl = completed.videoUrl!;
      let currentGenId = initial.id;
      const allProviderIds = [initial.id];

      if (
        provider.supportsExtension &&
        provider.extendGeneration &&
        job.duration > provider.maxDurationPerCall
      ) {
        const extensionsNeeded =
          Math.ceil(job.duration / provider.maxDurationPerCall) - 1;

        for (let i = 0; i < extensionsNeeded; i++) {
          await step.run(`update-extending-${i}`, async () => {
            await db.generation.update({
              where: { id: generationId },
              data: { status: "EXTENDING" },
            });
          });

          const extended = await step.run(`extend-${i}`, async () => {
            return provider.extendGeneration!(currentGenId, job.prompt);
          });

          const extCompleted = await step.run(`poll-ext-${i}`, async () => {
            return pollUntilComplete(provider, extended.id, {
              maxAttempts: 60,
              intervalMs: 10000,
            });
          });

          if (extCompleted.state === "failed") {
            // Use whatever we have so far
            break;
          }

          currentGenId = extended.id;
          currentVideoUrl = extCompleted.videoUrl || currentVideoUrl;
          allProviderIds.push(extended.id);
        }
      }

      // Step 4: Download and upload to R2
      const finalUrl = await step.run("upload-to-r2", async () => {
        await db.generation.update({
          where: { id: generationId },
          data: { status: "UPLOADING" },
        });

        const res = await fetch(currentVideoUrl);
        if (!res.ok) throw new Error(`Failed to download video: ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        const key = `videos/${generationId}.mp4`;
        return uploadVideo(key, buffer, "video/mp4");
      });

      // Step 5: Mark complete
      await step.run("mark-complete", async () => {
        await db.generation.update({
          where: { id: generationId },
          data: {
            status: "COMPLETED",
            videoUrl: finalUrl,
            providerIds: allProviderIds,
          },
        });
        await updateJobStatus(job.id);
      });

      return { status: "completed", videoUrl: finalUrl };
    }
  );
}

async function updateJobStatus(jobId: string) {
  const generations = await db.generation.findMany({
    where: { jobId },
  });

  const hasCompleted = generations.some((g) => g.status === "COMPLETED");
  const allFailed = generations.every(
    (g) => g.status === "FAILED"
  );
  const allDone = generations.every(
    (g) => g.status === "COMPLETED" || g.status === "FAILED"
  );

  if (hasCompleted && allDone) {
    await db.job.update({
      where: { id: jobId },
      data: { status: "COMPLETED" },
    });
  } else if (allFailed) {
    await db.job.update({
      where: { id: jobId },
      data: { status: "FAILED" },
    });
  } else if (hasCompleted) {
    // Some completed, some still running -- keep as COMPLETED so user sees results
    await db.job.update({
      where: { id: jobId },
      data: { status: "COMPLETED" },
    });
  }
}
