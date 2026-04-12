import { createProviderFunction } from "./create-provider-function";
import { lumaProvider } from "@/lib/providers/luma";

export const generateLuma = createProviderFunction("LUMA", lumaProvider);
