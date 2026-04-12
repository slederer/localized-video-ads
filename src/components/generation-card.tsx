"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GenerationCardProps {
  provider: string;
  status: string;
  videoUrl?: string | null;
  errorMessage?: string | null;
  onSelect?: () => void;
  isSelected?: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
  Luma: "from-blue-500 to-cyan-500",
  Runway: "from-rose-500 to-pink-500",
  Veo: "from-green-500 to-emerald-500",
  Kling: "from-orange-500 to-amber-500",
  MiniMax: "from-purple-500 to-violet-500",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; dotColor: string; progress: number }
> = {
  PENDING: { label: "Queued", dotColor: "bg-zinc-400", progress: 5 },
  GENERATING: { label: "Generating", dotColor: "bg-blue-500", progress: 30 },
  EXTENDING: { label: "Extending", dotColor: "bg-blue-500", progress: 60 },
  UPLOADING: { label: "Finalizing", dotColor: "bg-blue-500", progress: 90 },
  COMPLETED: { label: "Ready", dotColor: "bg-green-500", progress: 100 },
  FAILED: { label: "Failed", dotColor: "bg-red-500", progress: 0 },
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
  const isProcessing = !isReady && !isFailed;
  const gradient = PROVIDER_COLORS[provider] || "from-zinc-500 to-zinc-600";

  return (
    <div
      className={cn(
        "group relative rounded-2xl bg-white border border-zinc-200 overflow-hidden transition-all duration-200",
        isReady && "cursor-pointer hover:shadow-lg hover:border-zinc-300 hover:-translate-y-0.5",
        isSelected && "ring-2 ring-violet-600 border-transparent shadow-lg",
        isFailed && "opacity-50"
      )}
      onClick={isReady ? onSelect : undefined}
      role={isReady ? "button" : undefined}
      data-testid={`generation-card-${provider}`}
    >
      <div className={cn("h-1 bg-gradient-to-r", gradient)} />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-zinc-900">{provider}</span>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium gap-1.5 rounded-full",
              isReady && "bg-green-50 text-green-700",
              isFailed && "bg-red-50 text-red-600",
              isProcessing && "bg-zinc-100 text-zinc-600"
            )}
          >
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              config.dotColor,
              isProcessing && "animate-pulse"
            )} />
            {config.label}
          </Badge>
        </div>

        {isReady && videoUrl ? (
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              src={videoUrl}
              className="w-full aspect-video"
              muted
              loop
              playsInline
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                <svg className="h-5 w-5 text-zinc-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center justify-center aspect-video rounded-xl bg-red-50 text-sm text-red-500 gap-1">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{errorMessage || "Generation failed"}</span>
          </div>
        ) : (
          <div className="aspect-video rounded-xl bg-zinc-100 flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className={cn("h-10 w-10 rounded-full border-2 border-zinc-300 border-t-violet-600 animate-spin")} />
            </div>
            <span className="text-xs text-zinc-400 font-medium">{config.label}...</span>
          </div>
        )}
      </div>
    </div>
  );
}
