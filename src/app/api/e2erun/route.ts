import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { VIDEO_PROVIDERS } from "@/types";

// TEMPORARY token-guarded e2e trigger. ?providers=LUMA,SEEDANCE to
// limit fan-out (default: all). Removed once verification is done.
const E2E_TOKEN = "ca52dfb37f130433f7778587";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== E2E_TOKEN) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const requested = (url.searchParams.get("providers") || "")
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean);
  const providers = requested.length
    ? VIDEO_PROVIDERS.filter((p) => requested.includes(p))
    : [...VIDEO_PROVIDERS];

  if (!providers.length) {
    return NextResponse.json(
      { error: "no valid providers", valid: VIDEO_PROVIDERS },
      { status: 400 }
    );
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
        "A warm 8-second cinematic ad for a cozy neighborhood Italian restaurant, golden hour, steam rising from fresh pasta.",
      duration: 10,
      uploadedAssets: [],
      userId: user.id,
      generations: { create: providers.map((provider) => ({ provider })) },
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
    providers,
    generations: job.generations.map((g) => ({
      id: g.id,
      provider: g.provider,
    })),
  });
}
