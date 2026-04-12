"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Box, Spinner, VStack, Text } from "@chakra-ui/react";
import { HeaderClient } from "@/components/header-client";
import { AdForm } from "@/components/ad-form";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack gap="3">
          <Spinner size="lg" color="purple.500" />
          <Text fontSize="sm" color="gray.500">Loading...</Text>
        </VStack>
      </Box>
    );
  }

  if (!session) return null;

  return (
    <Box minH="100vh" bg="gray.50">
      <HeaderClient />
      <Box display="flex" flexDir="column" alignItems="center" py="12" px="6">
        <AdForm />
      </Box>
    </Box>
  );
}
