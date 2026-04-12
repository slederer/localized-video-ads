import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { AdForm } from "@/components/ad-form";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-surface)" }}>
      <Header />
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px" }}>
        <AdForm />
      </main>
    </div>
  );
}
