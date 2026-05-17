"use client";

import { Box } from "@chakra-ui/react";
import { HeaderClient } from "@/components/header-client";
import { AdForm } from "@/components/ad-form";

export function HomeClient() {
  return (
    <Box minH="100vh" bg="gray.50">
      <HeaderClient />
      <Box display="flex" flexDir="column" alignItems="center" py="12" px="6">
        <AdForm />
      </Box>
    </Box>
  );
}
