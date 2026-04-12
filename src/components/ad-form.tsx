"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
    <div className="w-full max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Create Your Video Ad
        </h1>
        <p className="mt-2 text-zinc-500 max-w-lg mx-auto">
          Describe your business and the ad you want. We'll generate it using 5 AI providers so you can compare and pick your favorite.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <Label htmlFor="prompt" className="text-sm font-semibold text-zinc-700">
            Describe your ad
          </Label>
          <Textarea
            id="prompt"
            placeholder="E.g., A cozy Italian restaurant in Brooklyn offering 20% off dinner this weekend. Warm, inviting tone with shots of delicious pasta and happy diners..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            minLength={10}
            maxLength={2000}
            required
            className="resize-none rounded-xl border-zinc-200 bg-white text-base placeholder:text-zinc-400 focus:border-violet-500 focus:ring-violet-500"
          />
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Be specific about your business, offer, and desired tone</span>
            <span>{prompt.length}/2000</span>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-zinc-700">
            Choose duration
          </Label>
          <DurationSelector value={duration} onChange={setDuration} />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-zinc-700">
            Reference images or videos
            <span className="font-normal text-zinc-400 ml-1">(optional)</span>
          </Label>
          <UploadZone onUploadComplete={setAssets} />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-base rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
          size="lg"
          disabled={isSubmitting || prompt.length < 10}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating with 5 AI providers...
            </span>
          ) : (
            "Generate Ad"
          )}
        </Button>
      </form>
    </div>
  );
}
