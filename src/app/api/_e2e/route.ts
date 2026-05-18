import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { VIDEO_PROVIDERS } from "@/types";

// TEMPORARY end-to-end pipeline trigger. Token-guarded, no auth.
// Mirrors /api/jobs fan-out exactly. Removed immediately after the test.
const E2E_TOKEN = "db8d7976f612d4203608a9686df29edb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== E2E_TOKEN) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const user = await db.user.findFirst({
    where: { email: "stefan.a.lederer@gmail.com" },
  });
  if (!user) {
    return NextResponse.json({ error: "test user not found" }, { status: 500 });
  }

  const job = await db.job.create({
    data: {
      prompt:
        "A warm 10-second cinematic ad for a cozy neighborhood Italian restaurant, golden hour, steam rising from fresh pasta.",
      duration: 10,
      uploadedAssets: [],
      userId: user.id,
      generations: {
        create: VIDEO_PROVIDERS.map((provider) => ({ provider })),
      },
    },
    include: { generations: true },
  });

  await inngest.send(
    job.generations.map((gen) => ({
      name: `video/generate.${gen.provider.toLowerCase()}`,
      data: { generationId: gen.id },
    }))
  );

  return NextResponse.json({
    jobId: job.id,
    generations: job.generations.map((g) => ({
      id: g.id,
      provider: g.provider,
    })),
  });
}
