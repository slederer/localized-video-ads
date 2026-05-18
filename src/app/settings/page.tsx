import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listApiKeyStatuses } from "@/lib/api-keys";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

const PROVIDER_LABELS: Record<string, { name: string; description: string }> = {
  RUNWAY: {
    name: "Runway",
    description: "Video generation (Gen-4 Turbo). Get a key at runwayml.com.",
  },
  LUMA: {
    name: "Luma Dream Machine",
    description: "Video generation. Get a key at lumalabs.ai.",
  },
  VEO: {
    name: "Google Veo",
    description: "Video generation via Google Cloud.",
  },
  KLING: {
    name: "Kling",
    description: "Video generation. Get a key at kling.ai.",
  },
  MINIMAX: {
    name: "MiniMax",
    description: "Video generation. Get a key at minimaxi.com.",
  },
  SEEDANCE: {
    name: "Seedance (BytePlus)",
    description:
      "ByteDance Seedance 2.0 via BytePlus ModelArk. Configured via env (AK/SK signature auth): SEEDANCE_ACCESS_KEY, SEEDANCE_SECRET_KEY, SEEDANCE_ENDPOINT_ID — not this single-key field.",
  },
  RESEND: {
    name: "Resend",
    description: "Transactional email (verification, password reset).",
  },
  UPLOADTHING_TOKEN: {
    name: "UploadThing",
    description: "File uploads (asset images for video generation).",
  },
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const statuses = await listApiKeyStatuses();
  const items = statuses.map((s) => ({
    ...s,
    label: PROVIDER_LABELS[s.provider]?.name ?? s.provider,
    description: PROVIDER_LABELS[s.provider]?.description ?? "",
    updatedAt: s.updatedAt ? s.updatedAt.toISOString() : null,
  }));

  return <SettingsClient items={items} />;
}
