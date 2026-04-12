"use client";

import { useState } from "react";
import { GenerationCard } from "./generation-card";
import { VideoPreview } from "./video-preview";

interface Generation {
  id: string;
  provider: string;
  status: string;
  videoUrl?: string | null;
  errorMessage?: string | null;
}

interface ResultsGalleryProps {
  generations: Generation[];
}

export function ResultsGallery({ generations }: ResultsGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = generations.find((g) => g.id === selectedId);

  // Sort: completed first, then in-progress, then failed
  const sorted = [...generations].sort((a, b) => {
    const order: Record<string, number> = {
      COMPLETED: 0,
      UPLOADING: 1,
      EXTENDING: 2,
      GENERATING: 3,
      PENDING: 4,
      FAILED: 5,
    };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  return (
    <div className="space-y-6">
      {selected?.videoUrl && (
        <VideoPreview
          videoUrl={selected.videoUrl}
          provider={selected.provider}
          onClose={() => setSelectedId(null)}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((gen) => (
          <GenerationCard
            key={gen.id}
            provider={gen.provider}
            status={gen.status}
            videoUrl={gen.videoUrl}
            errorMessage={gen.errorMessage}
            isSelected={gen.id === selectedId}
            onSelect={() => setSelectedId(gen.id)}
          />
        ))}
      </div>
    </div>
  );
}
