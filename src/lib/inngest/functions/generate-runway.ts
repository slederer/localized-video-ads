import { createProviderFunction } from "./create-provider-function";
import { runwayProvider } from "@/lib/providers/runway";

export const generateRunway = createProviderFunction("RUNWAY", runwayProvider);
