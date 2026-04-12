"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box, Container, VStack, HStack, Heading, Text, Button, Spinner,
  Link as ChakraLink,
} from "@chakra-ui/react";

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="lg" color="purple.500" />
      </Box>
    }>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"pending" | "verifying" | "success" | "error">(
    token ? "verifying" : "pending"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Verification failed");
        }
      } catch {
        setStatus("error");
        setErrorMsg("Something went wrong");
      }
    }

    verify();
  }, [token]);

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50" p="6">
      <Container maxW="440px">
        <VStack gap="6" align="center" textAlign="center">
          <HStack gap="2">
            <Box
              w="10" h="10" borderRadius="xl"
              bgGradient="to-br" gradientFrom="purple.600" gradientTo="indigo.600"
              display="flex" alignItems="center" justifyContent="center"
              color="white" fontWeight="bold" fontSize="xl"
            >
              A
            </Box>
            <Heading size="xl" fontWeight="bold">AdForge</Heading>
          </HStack>

          <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" p="10" w="full">
            {status === "pending" && (
              <VStack gap="4">
                <Box
                  w="16" h="16" borderRadius="full" bg="purple.50"
                  display="flex" alignItems="center" justifyContent="center"
                  fontSize="3xl"
                >
                  ✉️
                </Box>
                <Heading size="lg">Check your email</Heading>
                <Text color="gray.500" fontSize="sm" lineHeight="1.6">
                  We sent a verification link to{" "}
                  <Text as="span" fontWeight="semibold" color="gray.900">
                    {email || "your email"}
                  </Text>
                  . Click the link to activate your account.
                </Text>
                <Text color="gray.400" fontSize="xs">
                  Didn't receive it? Check your spam folder.
                </Text>
              </VStack>
            )}

            {status === "verifying" && (
              <VStack gap="4">
                <Spinner size="lg" color="purple.600" />
                <Text color="gray.500">Verifying your email...</Text>
              </VStack>
            )}

            {status === "success" && (
              <VStack gap="4">
                <Box
                  w="16" h="16" borderRadius="full" bg="green.50"
                  display="flex" alignItems="center" justifyContent="center"
                  fontSize="3xl"
                >
                  ✓
                </Box>
                <Heading size="lg" color="green.600">Email verified!</Heading>
                <Text color="gray.500" fontSize="sm">
                  Your account is now active. You can sign in.
                </Text>
                <ChakraLink href="/login">
                  <Button colorPalette="purple" size="lg" w="full">
                    Sign In
                  </Button>
                </ChakraLink>
              </VStack>
            )}

            {status === "error" && (
              <VStack gap="4">
                <Box
                  w="16" h="16" borderRadius="full" bg="red.50"
                  display="flex" alignItems="center" justifyContent="center"
                  fontSize="3xl"
                >
                  ✗
                </Box>
                <Heading size="lg" color="red.600">Verification failed</Heading>
                <Text color="gray.500" fontSize="sm">{errorMsg}</Text>
                <ChakraLink href="/register">
                  <Button variant="outline" size="lg">
                    Try again
                  </Button>
                </ChakraLink>
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
