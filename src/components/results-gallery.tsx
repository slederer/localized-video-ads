"use client";

import { useState } from "react";
import { Box, SimpleGrid } from "@chakra-ui/react";
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

  const sorted = [...generations].sort((a, b) => {
    const order: Record<string, number> = {
      COMPLETED: 0, UPLOADING: 1, EXTENDING: 2, GENERATING: 3, PENDING: 4, FAILED: 5,
    };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  return (
    <Box>
      {selected?.videoUrl && (
        <Box mb="6">
          <VideoPreview
            videoUrl={selected.videoUrl}
            provider={selected.provider}
            onClose={() => setSelectedId(null)}
          />
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
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
      </SimpleGrid>
    </Box>
  );
}
