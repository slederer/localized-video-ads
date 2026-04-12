import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { VIDEO_PROVIDERS } from "@/types";

const createJobSchema = z.object({
  prompt: z.string().min(10).max(2000),
  duration: z.union([z.literal(10), z.literal(15), z.literal(30)]),
  assets: z.array(z.url()).max(5).optional().default([]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { prompt, duration, assets } = parsed.data;

  const job = await db.job.create({
    data: {
      prompt,
      duration,
      uploadedAssets: assets,
      userId: session.user.id,
      generations: {
        create: VIDEO_PROVIDERS.map((provider) => ({
          provider,
        })),
      },
    },
    include: { generations: true },
  });

  // Fan-out: send one event per provider
  await inngest.send(
    job.generations.map((gen) => ({
      name: `video/generate.${gen.provider.toLowerCase()}`,
      data: { generationId: gen.id },
    }))
  );

  return NextResponse.json({ jobId: job.id }, { status: 201 });
}
