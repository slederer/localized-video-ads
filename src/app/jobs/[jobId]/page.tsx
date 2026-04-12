"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { HeaderClient } from "@/components/header-client";
import { ResultsGallery } from "@/components/results-gallery";

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
    return () => { active = false; };
  }, [jobId]);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-surface)" }}>
        <HeaderClient />
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 24px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ef4444">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <p style={{ fontSize: "18px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "16px" }}>{error}</p>
            <Link href="/" className="brand-btn" style={{
              display: "inline-flex",
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}>
              Create New Ad
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-surface)" }}>
        <HeaderClient />
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 24px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "3px solid #e4e4e7",
            borderTopColor: "var(--color-brand)",
            animation: "spin 1s linear infinite",
            marginBottom: "16px",
          }} />
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>Loading your ad results...</p>
        </main>
      </div>
    );
  }

  const completedCount = job.generations.filter((g) => g.status === "COMPLETED").length;
  const totalCount = job.generations.length;
  const allDone = job.generations.every((g) => g.status === "COMPLETED" || g.status === "FAILED");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-surface)" }}>
      <HeaderClient />
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>Your Video Ads</h1>
              <span style={{
                padding: "2px 10px",
                borderRadius: "100px",
                backgroundColor: "var(--color-brand-light)",
                color: "var(--color-brand)",
                fontSize: "12px",
                fontWeight: 600,
              }}>
                {job.duration}s
              </span>
            </div>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", maxWidth: "600px" }}>{job.prompt}</p>
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "100px",
            fontSize: "13px",
            fontWeight: 600,
            backgroundColor: allDone ? "#dcfce7" : "#fef3c7",
            color: allDone ? "#16a34a" : "#d97706",
          }}>
            {!allDone && (
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#d97706",
                animation: "pulse 2s infinite",
              }} />
            )}
            {completedCount}/{totalCount} ready
          </div>
        </div>

        {/* Gallery */}
        <ResultsGallery generations={job.generations} />

        {/* Footer */}
        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--color-border-light)" }}>
          <Link href="/" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 18px",
            borderRadius: "10px",
            border: "1px solid var(--color-border-light)",
            backgroundColor: "var(--color-surface-raised)",
            color: "var(--color-text-primary)",
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
            transition: "all 0.15s",
          }}>
            + Create Another Ad
          </Link>
        </div>
      </main>
    </div>
  );
}
