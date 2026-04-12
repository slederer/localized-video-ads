export { lumaProvider } from "./luma";
export { runwayProvider } from "./runway";
export { veoProvider } from "./veo";
export { klingProvider } from "./kling";
export { minimaxProvider } from "./minimax";
export type {
  VideoProviderClient,
  GenerateOptions,
  GenerationResult,
  GenerationStatus,
} from "./types";
export { pollUntilComplete } from "./types";

import { lumaProvider } from "./luma";
import { runwayProvider } from "./runway";
import { veoProvider } from "./veo";
import { klingProvider } from "./kling";
import { minimaxProvider } from "./minimax";
import type { VideoProviderClient } from "./types";

export const allProviders: Record<string, VideoProviderClient> = {
  LUMA: lumaProvider,
  RUNWAY: runwayProvider,
  VEO: veoProvider,
  KLING: klingProvider,
  MINIMAX: minimaxProvider,
};
