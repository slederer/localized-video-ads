import { createProviderFunction } from "./create-provider-function";
import { seedanceProvider } from "@/lib/providers/seedance";

export const generateSeedance = createProviderFunction(
  "SEEDANCE",
  seedanceProvider
);
