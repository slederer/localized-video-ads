import { createProviderFunction } from "./create-provider-function";
import { minimaxProvider } from "@/lib/providers/minimax";

export const generateMinimax = createProviderFunction("MINIMAX", minimaxProvider);
