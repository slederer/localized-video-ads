"use client";

import { cn } from "@/lib/utils";

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
    <div className="grid grid-cols-3 gap-3">
      {DURATIONS.map((d) => (
        <button
          key={d.value}
          type="button"
          onClick={() => onChange(d.value)}
          className={cn(
            "flex flex-col items-center rounded-xl border-2 px-4 py-4 transition-all",
            value === d.value
              ? "border-violet-600 bg-violet-50 shadow-sm"
              : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
          )}
        >
          <span className={cn(
            "text-2xl font-bold",
            value === d.value ? "text-violet-700" : "text-zinc-900"
          )}>
            {d.label}
          </span>
          <span className={cn(
            "text-xs font-medium mt-0.5",
            value === d.value ? "text-violet-600" : "text-zinc-500"
          )}>
            {d.desc}
          </span>
          <span className="text-[10px] text-zinc-400 mt-1">{d.estimate}</span>
        </button>
      ))}
    </div>
  );
}
