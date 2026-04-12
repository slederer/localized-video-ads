"use client";

const DURATIONS = [
  { value: 10, label: "10s", desc: "Quick teaser", estimate: "~30s to generate" },
  { value: 15, label: "15s", desc: "Social media", estimate: "~1min to generate" },
  { value: 30, label: "30s", desc: "Full ad spot", estimate: "~3min to generate" },
] as const;

interface DurationSelectorProps {
  value: number;
  onChange: (duration: number) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
      {DURATIONS.map((d) => {
        const isActive = value === d.value;
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => onChange(d.value)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px 12px",
              borderRadius: "12px",
              border: isActive ? "2px solid var(--color-brand)" : "2px solid var(--color-border-light)",
              backgroundColor: isActive ? "var(--color-brand-light)" : "var(--color-surface-raised)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <span style={{
              fontSize: "24px",
              fontWeight: 700,
              color: isActive ? "var(--color-brand)" : "var(--color-text-primary)",
            }}>
              {d.label}
            </span>
            <span style={{
              fontSize: "12px",
              fontWeight: 500,
              marginTop: "2px",
              color: isActive ? "var(--color-brand)" : "var(--color-text-secondary)",
            }}>
              {d.desc}
            </span>
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              {d.estimate}
            </span>
          </button>
        );
      })}
    </div>
  );
}
