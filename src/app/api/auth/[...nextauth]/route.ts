import { handlers } from "@/auth";

const originalGET = handlers.GET;

export const GET = async (req: Request) => {
  console.log("[auth-debug] GET URL:", req.url);
  console.log("[auth-debug] headers:", JSON.stringify(Object.fromEntries(req.headers)));
  return originalGET(req);
};

export const { POST } = handlers;
