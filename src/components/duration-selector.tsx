"use client";

import { cn } from "@/lib/utils";

const DURATIONS = [
  { value: 10, label: "10s", estimate: "~30s" },
  { value: 15, label: "15s", estimate: "~1min" },
  { value: 30, label: "30s", estimate: "~3min" },
] as const;

interface DurationSelectorProps {
  value: number;
  onChange: (duration: number) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  return (
    <div className="flex gap-3">
      {DURATIONS.map((d) => (
        <button
          key={d.value}
          type="button"
          onClick={() => onChange(d.value)}
          className={cn(
            "flex flex-col items-center rounded-lg border-2 px-6 py-3 transition-colors",
            value === d.value
              ? "border-primary bg-primary/5 text-primary"
              : "border-muted hover:border-muted-foreground/30"
          )}
        >
          <span className="text-lg font-semibold">{d.label}</span>
          <span className="text-xs text-muted-foreground">{d.estimate}</span>
        </button>
      ))}
    </div>
  );
}
