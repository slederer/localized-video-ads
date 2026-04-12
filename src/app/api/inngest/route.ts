import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  generateLuma,
  generateRunway,
  generateVeo,
  generateKling,
  generateMinimax,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateLuma,
    generateRunway,
    generateVeo,
    generateKling,
    generateMinimax,
  ],
});
