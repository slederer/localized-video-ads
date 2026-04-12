export const VIDEO_PROVIDERS = [
  "LUMA",
  "RUNWAY",
  "VEO",
  "KLING",
  "MINIMAX",
] as const;

export type VideoProviderKey = (typeof VIDEO_PROVIDERS)[number];

export const VALID_DURATIONS = [10, 15, 30] as const;
export type ValidDuration = (typeof VALID_DURATIONS)[number];
