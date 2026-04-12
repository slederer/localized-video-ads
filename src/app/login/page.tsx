"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box, Container, VStack, HStack, Heading, Text, Input, Button,
  Separator, Link as ChakraLink, Alert,
} from "@chakra-ui/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Make sure your email is verified.");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <Box minH="100vh" display="flex">
      {/* Left hero */}
      <Box
        display={{ base: "none", lg: "flex" }}
        w="50%"
        bgGradient="to-br"
        gradientFrom="purple.600"
        gradientTo="indigo.700"
        flexDir="column"
        justifyContent="center"
        p="16"
        color="white"
      >
        <Heading size="4xl" fontWeight="bold" lineHeight="1.1" letterSpacing="-0.02em">
          Create stunning{"\n"}video ads with AI
        </Heading>
        <Text mt="6" fontSize="lg" opacity={0.8} maxW="440px" lineHeight="1.6">
          5 AI providers generate your ad in parallel. Compare results side by side and pick the best one for your business.
        </Text>
        <HStack mt="12" gap="12" fontSize="sm" opacity={0.6}>
          <Box>
            <Text fontSize="3xl" fontWeight="bold" opacity={1}>5</Text>
            <Text>AI Providers</Text>
          </Box>
          <Box>
            <Text fontSize="3xl" fontWeight="bold" opacity={1}>30s</Text>
            <Text>Max Duration</Text>
          </Box>
          <Box>
            <Text fontSize="3xl" fontWeight="bold" opacity={1}>~3min</Text>
            <Text>Generation</Text>
          </Box>
        </HStack>
      </Box>

      {/* Right form */}
      <Box flex="1" display="flex" alignItems="center" justifyContent="center" p="6" bg="gray.50">
        <Container maxW="400px">
          <VStack gap="8" align="stretch">
            {/* Logo */}
            <VStack gap="2">
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
              <Text color="gray.500" fontSize="sm">Sign in to your account</Text>
            </VStack>

            {/* Google OAuth */}
            <Button
              w="full"
              size="lg"
              variant="outline"
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: "8px" }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <HStack>
              <Separator flex="1" />
              <Text fontSize="xs" color="gray.400" px="2">or sign in with email</Text>
              <Separator flex="1" />
            </HStack>

            {/* Email form */}
            <form onSubmit={handleSubmit}>
              <VStack gap="4" align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb="1.5">Email</Text>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="lg"
                    required
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb="1.5">Password</Text>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    size="lg"
                    minLength={8}
                    required
                  />
                </Box>

                {error && (
                  <Alert.Root status="error" borderRadius="lg">
                    <Alert.Indicator />
                    <Alert.Title fontSize="sm">{error}</Alert.Title>
                  </Alert.Root>
                )}

                <Button
                  type="submit"
                  w="full"
                  size="lg"
                  colorPalette="purple"
                  loading={loading}
                  loadingText="Signing in..."
                >
                  Sign In
                </Button>
              </VStack>
            </form>

            <Text fontSize="sm" color="gray.500" textAlign="center">
              Don't have an account?{" "}
              <ChakraLink href="/register" color="purple.600" fontWeight="medium">
                Create one
              </ChakraLink>
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
