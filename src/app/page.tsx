import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HomeClient } from "@/components/home-client";

// Session-dependent: never statically prerender or cache this route.
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <HomeClient />;
}
