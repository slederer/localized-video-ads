import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { AdForm } from "@/components/ad-form";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="flex flex-col items-center px-6 py-12">
        <AdForm />
      </main>
    </div>
  );
}
