"use client";

interface GenerationCardProps {
  provider: string;
  status: string;
  videoUrl?: string | null;
  errorMessage?: string | null;
  onSelect?: () => void;
  isSelected?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Queued", color: "var(--color-text-muted)" },
  GENERATING: { label: "Generating", color: "var(--color-info)" },
  EXTENDING: { label: "Extending", color: "var(--color-info)" },
  UPLOADING: { label: "Finalizing", color: "var(--color-info)" },
  COMPLETED: { label: "Ready", color: "var(--color-success)" },
  FAILED: { label: "Failed", color: "var(--color-error)" },
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
  const barClass = `provider-bar-${provider.toLowerCase()}`;

  return (
    <div
      data-testid={`generation-card-${provider}`}
      onClick={isReady ? onSelect : undefined}
      role={isReady ? "button" : undefined}
      style={{
        borderRadius: "16px",
        backgroundColor: "var(--color-surface-raised)",
        border: isSelected ? "2px solid var(--color-brand)" : "1px solid var(--color-border-light)",
        overflow: "hidden",
        cursor: isReady ? "pointer" : "default",
        opacity: isFailed ? 0.5 : 1,
        transition: "all 0.2s",
      }}
    >
      <div className={barClass} style={{ height: "3px" }} />

      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontWeight: 600, fontSize: "15px", color: "var(--color-text-primary)" }}>{provider}</span>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: "100px",
            backgroundColor: isReady ? "#dcfce7" : isFailed ? "#fef2f2" : "#f4f4f5",
            color: config.color,
          }}>
            {isProcessing && (
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: config.color,
                animation: "pulse 2s infinite",
              }} />
            )}
            {config.label}
          </span>
        </div>

        {isReady && videoUrl ? (
          <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", backgroundColor: "#000" }}>
            <video
              src={videoUrl}
              style={{ width: "100%", aspectRatio: "16/9", display: "block" }}
              muted
              loop
              playsInline
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
            />
          </div>
        ) : isFailed ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            aspectRatio: "16/9",
            borderRadius: "12px",
            backgroundColor: "#fef2f2",
            color: "#ef4444",
            fontSize: "13px",
            gap: "4px",
          }}>
            <span>{errorMessage || "Generation failed"}</span>
          </div>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            aspectRatio: "16/9",
            borderRadius: "12px",
            backgroundColor: "#f4f4f5",
            gap: "12px",
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "3px solid #e4e4e7",
              borderTopColor: "var(--color-brand)",
              animation: "spin 1s linear infinite",
            }} />
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              {config.label}...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
