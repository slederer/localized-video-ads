"use client";

import Link from "next/link";

export function HeaderClient() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold">
            AdForge
          </Link>
          <span className="text-sm text-muted-foreground">
            AI Video Ads for Local Businesses
          </span>
        </div>
      </div>
    </header>
  );
}
