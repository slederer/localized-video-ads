"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Your Video Ad</CardTitle>
        <CardDescription>
          Describe your business and the ad you want. We&apos;ll generate it
          using 5 AI providers so you can pick your favorite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Ad Description</Label>
            <Textarea
              id="prompt"
              placeholder="E.g., A cozy Italian restaurant in Brooklyn offering 20% off dinner this weekend. Warm, inviting tone with shots of delicious pasta and happy diners."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              minLength={10}
              maxLength={2000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {prompt.length}/2000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ad Duration</Label>
            <DurationSelector value={duration} onChange={setDuration} />
          </div>

          <div className="space-y-2">
            <Label>Reference Images / Videos</Label>
            <UploadZone onUploadComplete={setAssets} />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || prompt.length < 10}
          >
            {isSubmitting ? "Creating..." : "Generate Ad"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
