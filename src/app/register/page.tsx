"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Container, VStack, HStack, Heading, Text, Input, Button,
  Link as ChakraLink, Alert,
} from "@chakra-ui/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/verify?email=" + encodeURIComponent(email));
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50" p="6">
      <Container maxW="440px">
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
            <Text color="gray.500" fontSize="sm">Create your account</Text>
          </VStack>

          <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" p="8">
            <form onSubmit={handleSubmit}>
              <VStack gap="4" align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb="1.5">Full name</Text>
                  <Input
                    placeholder="John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    size="lg"
                    required
                  />
                </Box>
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
                    placeholder="At least 8 characters"
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
                  loadingText="Creating account..."
                >
                  Create Account
                </Button>
              </VStack>
            </form>
          </Box>

          <Text fontSize="sm" color="gray.500" textAlign="center">
            Already have an account?{" "}
            <ChakraLink href="/login" color="purple.600" fontWeight="medium">
              Sign in
            </ChakraLink>
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
