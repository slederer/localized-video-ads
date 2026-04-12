import { createProviderFunction } from "./create-provider-function";
import { klingProvider } from "@/lib/providers/kling";

export const generateKling = createProviderFunction("KLING", klingProvider);
