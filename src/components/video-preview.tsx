"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VideoPreviewProps {
  videoUrl: string;
  provider: string;
  onClose: () => void;
}

export function VideoPreview({
  videoUrl,
  provider,
  onClose,
}: VideoPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Preview</h3>
          <Badge variant="secondary">{provider}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <video
        src={videoUrl}
        className="w-full rounded-lg aspect-video bg-black"
        controls
        autoPlay
        loop
        data-testid="video-player"
      />

      <div className="flex gap-3">
        <a href={videoUrl} download target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button className="w-full">
            Download Video
          </Button>
        </a>
      </div>
    </div>
  );
}
