"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { HeaderClient } from "@/components/header-client";
import { ResultsGallery } from "@/components/results-gallery";
import { Button } from "@/components/ui/button";

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
      <div className="min-h-screen bg-zinc-50">
        <HeaderClient />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-zinc-900">{error}</p>
            <Link href="/">
              <Button className="rounded-xl">Create New Ad</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <HeaderClient />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 rounded-full border-2 border-zinc-300 border-t-violet-600 animate-spin" />
            <p className="text-sm text-zinc-500">Loading your ad results...</p>
          </div>
        </main>
      </div>
    );
  }

  const completedCount = job.generations.filter(
    (g) => g.status === "COMPLETED"
  ).length;
  const totalCount = job.generations.length;
  const allDone = job.generations.every(
    (g) => g.status === "COMPLETED" || g.status === "FAILED"
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <HeaderClient />
      <main className="container mx-auto max-w-6xl px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Your Video Ads
              </h1>
              <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                {job.duration}s
              </span>
            </div>
            <p className="text-sm text-zinc-500 max-w-2xl line-clamp-2">{job.prompt}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
              allDone
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {!allDone && (
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
              {completedCount}/{totalCount} ready
            </div>
          </div>
        </div>

        <ResultsGallery generations={job.generations} />

        <div className="pt-6 border-t border-zinc-200">
          <Link href="/">
            <Button variant="outline" className="rounded-xl">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Another Ad
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
