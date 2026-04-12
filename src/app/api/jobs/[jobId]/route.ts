import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await db.job.findUnique({
    where: { id: jobId },
    include: {
      generations: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    prompt: job.prompt,
    duration: job.duration,
    uploadedAssets: job.uploadedAssets,
    createdAt: job.createdAt,
    generations: job.generations.map((gen) => ({
      id: gen.id,
      provider: gen.provider,
      status: gen.status,
      videoUrl: gen.videoUrl,
      errorMessage: gen.errorMessage,
      updatedAt: gen.updatedAt,
    })),
  });
}
