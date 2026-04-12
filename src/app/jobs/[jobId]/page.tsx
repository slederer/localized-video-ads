"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { HeaderClient } from "@/components/header-client";
import { ResultsGallery } from "@/components/results-gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Generation {
  id: string;
  provider: string;
  status: string;
  videoUrl?: string | null;
  errorMessage?: string | null;
  updatedAt: string;
}

interface Job {
  id: string;
  status: string;
  prompt: string;
  duration: number;
  generations: Generation[];
  createdAt: string;
}

export default function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          setError("Job not found");
          return;
        }
        const data = await res.json();
        if (active) setJob(data);

        // Keep polling if not all done
        const allDone = data.generations.every(
          (g: Generation) =>
            g.status === "COMPLETED" || g.status === "FAILED"
        );
        if (!allDone && active) {
          setTimeout(poll, 4000);
        }
      } catch {
        if (active) setError("Failed to load job status");
      }
    }

    poll();
    return () => {
      active = false;
    };
  }, [jobId]);

  if (error) {
    return (
      <>
        <HeaderClient />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="text-center space-y-4">
            <p className="text-lg text-destructive">{error}</p>
            <Link href="/">
              <Button>Create New Ad</Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <HeaderClient />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </main>
      </>
    );
  }

  const completedCount = job.generations.filter(
    (g) => g.status === "COMPLETED"
  ).length;
  const totalCount = job.generations.length;

  return (
    <>
      <HeaderClient />
      <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Your Video Ads</h1>
            <Badge variant="outline">{job.duration}s</Badge>
            <Badge
              variant={
                job.status === "COMPLETED"
                  ? "default"
                  : job.status === "FAILED"
                    ? "destructive"
                    : "secondary"
              }
            >
              {completedCount}/{totalCount} ready
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{job.prompt}</p>
        </div>

        <ResultsGallery generations={job.generations} />

        <div className="pt-4 border-t">
          <Link href="/">
            <Button variant="outline">Create Another Ad</Button>
          </Link>
        </div>
      </main>
    </>
  );
}
