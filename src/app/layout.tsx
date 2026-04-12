import type { Metadata } from "next";
import { Providers } from "@/components/chakra-provider";

export const metadata: Metadata = {
  title: "AdForge - AI Video Ads for Local Businesses",
  description:
    "Create professional video ads in seconds using 5 AI providers. Compare results and pick your favorite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
