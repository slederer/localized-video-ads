"use client";

import { useSession, signOut } from "next-auth/react";
import { Box, Container, HStack, Heading, Text, Button, Image } from "@chakra-ui/react";
import Link from "next/link";

export function HeaderClient() {
  const { data: session } = useSession();

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex="50"
      borderBottom="1px solid"
      borderColor="gray.200"
      bg="white/80"
      backdropFilter="blur(12px)"
    >
      <Container maxW="1200px">
        <HStack h="16" justify="space-between">
          <Link href="/" style={{ textDecoration: "none" }}>
            <HStack gap="2.5">
              <Box
                w="8" h="8" borderRadius="lg"
                bgGradient="to-br" gradientFrom="purple.600" gradientTo="indigo.600"
                display="flex" alignItems="center" justifyContent="center"
                color="white" fontWeight="bold" fontSize="sm"
              >
                A
              </Box>
              <Heading size="md" fontWeight="bold">AdForge</Heading>
            </HStack>
          </Link>

          {session?.user && (
            <HStack gap="3">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  w="7" h="7" borderRadius="full"
                />
              )}
              <Text fontSize="sm" color="gray.600" display={{ base: "none", sm: "block" }}>
                {session.user.name || session.user.email}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                color="gray.500"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
            </HStack>
          )}
        </HStack>
      </Container>
    </Box>
  );
}
