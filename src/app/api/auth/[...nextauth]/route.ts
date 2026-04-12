import { handlers } from "@/auth";

const originalGET = handlers.GET;

export const GET = async (req: Request) => {
  console.log("[auth-debug] GET URL:", req.url);
  return originalGET(req as any);
};

export const { POST } = handlers;
