"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface GenerationCardProps {
  provider: string;
  status: string;
  videoUrl?: string | null;
  errorMessage?: string | null;
  onSelect?: () => void;
  isSelected?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; progress: number }
> = {
  PENDING: { label: "Queued", color: "bg-muted", progress: 5 },
  GENERATING: { label: "Generating", color: "bg-blue-100", progress: 30 },
  EXTENDING: { label: "Extending", color: "bg-blue-100", progress: 60 },
  UPLOADING: { label: "Finalizing", color: "bg-blue-100", progress: 90 },
  COMPLETED: { label: "Ready", color: "bg-green-100", progress: 100 },
  FAILED: { label: "Failed", color: "bg-red-100", progress: 0 },
};

export function GenerationCard({
  provider,
  status,
  videoUrl,
  errorMessage,
  onSelect,
  isSelected,
}: GenerationCardProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const isReady = status === "COMPLETED" && videoUrl;
  const isFailed = status === "FAILED";

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary",
        isFailed && "opacity-60"
      )}
      onClick={isReady ? onSelect : undefined}
      role={isReady ? "button" : undefined}
      data-testid={`generation-card-${provider}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm">{provider}</span>
          <Badge
            variant="secondary"
            className={cn("text-xs", config.color)}
          >
            {config.label}
          </Badge>
        </div>

        {isReady && videoUrl ? (
          <video
            src={videoUrl}
            className="w-full rounded-md aspect-video bg-black"
            muted
            loop
            playsInline
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
        ) : isFailed ? (
          <div className="flex items-center justify-center aspect-video rounded-md bg-red-50 text-sm text-red-600">
            {errorMessage || "Generation failed"}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center aspect-video rounded-md bg-muted">
              <div className="animate-pulse text-sm text-muted-foreground">
                {config.label}...
              </div>
            </div>
            <Progress value={config.progress} className="h-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
