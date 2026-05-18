import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { HomeClient } from "@/components/home-client";

// Session-dependent: never statically prerender or cache this route.
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  if (!session) {
    // TEMP DIAGNOSTIC: is a session cookie present but auth() still null?
    const all = await cookies();
    const authCookies = all
      .getAll()
      .map((c) => c.name)
      .filter((n) => n.toLowerCase().includes("authjs"));
    console.error(
      `[home-gate] auth() returned null. authjs cookies present: ${
        authCookies.length ? authCookies.join(", ") : "NONE"
      }`
    );
    redirect("/login");
  }

  return <HomeClient />;
}
