import { createProviderFunction } from "./create-provider-function";
import { veoProvider } from "@/lib/providers/veo";

export const generateVeo = createProviderFunction("VEO", veoProvider);
