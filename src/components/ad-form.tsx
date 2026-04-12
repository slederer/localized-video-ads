"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DurationSelector } from "./duration-selector";
import { UploadZone } from "./upload-zone";

export function AdForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(10);
  const [assets, setAssets] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, duration, assets }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create job");
      }

      const data = await res.json();
      router.push(`/jobs/${data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: "640px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Create Your Video Ad
        </h1>
        <p style={{ marginTop: "8px", fontSize: "16px", color: "var(--color-text-secondary)", maxWidth: "480px", margin: "8px auto 0" }}>
          Describe your business and ad. We generate it with 5 AI providers so you can compare and pick your favorite.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Prompt */}
        <div style={{ marginBottom: "28px" }}>
          <label htmlFor="prompt" style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>
            Describe your ad
          </label>
          <textarea
            id="prompt"
            placeholder="E.g., A cozy Italian restaurant in Brooklyn offering 20% off dinner this weekend. Warm, inviting tone with shots of delicious pasta and happy diners..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            minLength={10}
            maxLength={2000}
            required
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid var(--color-border-light)",
              backgroundColor: "var(--color-surface-raised)",
              fontSize: "15px",
              lineHeight: 1.5,
              resize: "none",
              fontFamily: "inherit",
              color: "var(--color-text-primary)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "12px", color: "var(--color-text-muted)" }}>
            <span>Be specific about your business, offer, and desired tone</span>
            <span>{prompt.length}/2000</span>
          </div>
        </div>

        {/* Duration */}
        <div style={{ marginBottom: "28px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>
            Choose duration
          </label>
          <DurationSelector value={duration} onChange={setDuration} />
        </div>

        {/* Upload */}
        <div style={{ marginBottom: "28px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>
            Reference images or videos
            <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: "6px" }}>(optional)</span>
          </label>
          <UploadZone onUploadComplete={setAssets} />
        </div>

        {/* Error */}
        {error && (
          <div role="alert" style={{
            padding: "12px 16px",
            borderRadius: "12px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: "14px",
            marginBottom: "20px",
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="brand-btn"
          disabled={isSubmitting || prompt.length < 10}
          style={{
            width: "100%",
            height: "48px",
            borderRadius: "12px",
            border: "none",
            fontSize: "16px",
            fontWeight: 600,
            cursor: isSubmitting || prompt.length < 10 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isSubmitting ? (
            <>
              <svg style={{ animation: "spin 1s linear infinite", width: "18px", height: "18px" }} viewBox="0 0 24 24" fill="none">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating with 5 AI providers...
            </>
          ) : (
            "Generate Ad"
          )}
        </button>
      </form>
    </div>
  );
}
