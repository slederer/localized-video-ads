"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  setApiKey,
  deleteApiKey,
  SUPPORTED_API_KEY_PROVIDERS,
  type ApiKeyProvider,
} from "@/lib/api-keys";

export type ActionResult =
  | { ok: true; provider: ApiKeyProvider }
  | { ok: false; error: string };

function isSupportedProvider(value: unknown): value is ApiKeyProvider {
  return (
    typeof value === "string" &&
    (SUPPORTED_API_KEY_PROVIDERS as readonly string[]).includes(value)
  );
}

export async function saveApiKeyAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }

  const provider = formData.get("provider");
  const apiKey = formData.get("apiKey");

  if (!isSupportedProvider(provider)) {
    return { ok: false, error: "Unknown provider" };
  }
  if (typeof apiKey !== "string" || apiKey.trim().length < 8) {
    return { ok: false, error: "API key looks too short" };
  }

  await setApiKey(provider, apiKey.trim(), session.user.id);
  revalidatePath("/settings");
  return { ok: true, provider };
}

export async function deleteApiKeyAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }
  const provider = formData.get("provider");
  if (!isSupportedProvider(provider)) {
    return { ok: false, error: "Unknown provider" };
  }
  await deleteApiKey(provider);
  revalidatePath("/settings");
  return { ok: true, provider };
}
