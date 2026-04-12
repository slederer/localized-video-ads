import Link from "next/link";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="text-xl font-bold">
          AdForge
        </Link>
        <span className="ml-2 text-sm text-muted-foreground">
          AI Video Ads for Local Businesses
        </span>
      </div>
    </header>
  );
}
