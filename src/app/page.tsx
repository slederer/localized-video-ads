import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { AdForm } from "@/components/ad-form";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <AdForm />
      </main>
    </>
  );
}
