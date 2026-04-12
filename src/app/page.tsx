import { Header } from "@/components/header";
import { AdForm } from "@/components/ad-form";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <AdForm />
      </main>
    </>
  );
}
